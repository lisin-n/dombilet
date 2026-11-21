"""Place the extra zones from the latest SVG on the illustrated Yas Marina map."""
import html
import json
from pathlib import Path
import re
from xml.etree import ElementTree as ET

SCHEMES = Path(__file__).resolve().parents[1] / 'site/schemes'
MAPS = SCHEMES / 'assets/maps'
ZONES = json.loads((MAPS / 'latest-zones.json').read_text())
CATALOG = json.loads((SCHEMES / 'data.js').read_text().split('=', 1)[1].strip().rstrip(';'))['yas']['sectors']
SVG_PATTERN = r'<svg\b(?=[^>]*data-orient="[lp]")[\s\S]*?</svg>'
LATEST = ET.fromstring(re.search(SVG_PATTERN, (MAPS / 'yas-marina-latest.html').read_text())[0])
REFERENCE = ET.fromstring(re.search(SVG_PATTERN, (SCHEMES / 'widget-yas.html').read_text())[0])
ILLUSTRATION_PIVOT = complex(1250, 990)

# Centres in the landscape view. These zones follow the illustrated track's
# local curves, which differ from the source SVG around the straights and hairpins.
TRACKSIDE_POSITIONS = {
    'west-straight': (1208, 1263),
    'club58': (1270, 1327),
    'yas-suite-west': (1458, 1385),
    'west-club': (1540, 1361),
    'turn-at-west': (1622, 1308),
    'marsa-suite': (1807, 1213),
    'deck-at-9': (1918, 586),
    'south-club': (2131, 686),
    'north-straight': (718, 1100),
    'sunset-lounge': (693, 861),
    'trackside-at-sunset-lounge': (664, 867),
    'lounge-north': (361, 982),
    'shams-suite': (565, 1101),
    'north-straight-premium': (709, 1124),
}


def sectors(svg):
    return {group.get('data-sector'): group for group in svg.iter()
            if 'sector' in group.get('class', '').split()}


def shapes(group):
    return [shape for shape in group.iter() if 'sec-shape' in shape.get('class', '').split()]


def source_center(key):
    x1, y1, x2, y2 = ZONES[key]['bbox']
    return complex((x1 + x2) / 2, (y1 + y2) / 2)


def reference_center(group):
    shape = shapes(group)[0]
    points = shape.get('points') or shape.get('d')
    xy = [(float(x), float(y)) for x, y in re.findall(r'([\d.]+)[ ,]([\d.]+)', points)]
    x, y = zip(*xy)
    return complex((min(x) + max(x)) / 2, (min(y) + max(y)) / 2)


def render_geometry(group):
    for shape in shapes(group):
        tag = shape.tag.rsplit('}', 1)[-1]
        assert tag in {'path', 'circle'}, tag
        attrs = ' '.join(f'{name}="{shape.get(name)}"' for name in ('d', 'cx', 'cy', 'r')
                         if name in shape.attrib)
        yield f'<{tag} class="sec-shape zone-shape" {attrs}/>'


# Reuse the six shared sectors to match scale and bearing. Anchor each cluster
# to its illustrated grandstand to keep local positions together on the two drawings.
original = {key: group for key, group in sectors(REFERENCE).items()
            if 'yas-map-zone' not in group.get('class', '').split()}
anchors = {key: reference_center(group) for key, group in original.items() if key in ZONES}
source_mean = sum(map(source_center, anchors)) / len(anchors)
reference_mean = sum(anchors.values()) / len(anchors)
rotation = sum((point - reference_mean) * (source_center(key) - source_mean).conjugate()
               for key, point in anchors.items()) / sum(abs(source_center(key) - source_mean) ** 2 for key in anchors)


def draw_zone(key, group, orientation):
    source = source_center(key)
    if key in TRACKSIDE_POSITIONS:
        landscape = complex(*TRACKSIDE_POSITIONS[key])
        centre = ILLUSTRATION_PIVOT + 1j * (landscape - ILLUSTRATION_PIVOT)
    else:
        anchor = ZONES[key]['parent'] or min(anchors, key=lambda item: abs(source - source_center(item)))
        centre = anchors[anchor] + rotation * (source - source_center(anchor))
    origin = centre - rotation * source
    transform = f'matrix({rotation.real:.5f} {rotation.imag:.5f} {-rotation.imag:.5f} {rotation.real:.5f} {origin.real:.2f} {origin.imag:.2f})'
    name = html.escape(CATALOG[key]['name'], quote=True)
    geometry = ''.join(render_geometry(group))
    if key in {'yas-suite-main-premium', 'trackside-at-sunset-lounge'}:
        # The original star is cut out of the dot. Its centre should still respond to taps.
        geometry = (f'<circle class="yas-zone-hit" cx="{source.real:.2f}" cy="{source.imag:.2f}" r="4.41"/>'
                    + geometry)
    if key == '16-360-the-terrace-collection':
        # The narrow outline encloses three separately selectable terraces. Use the source label anchor as a tap point.
        geometry += '<circle class="sec-shape zone-shape yas-collection-pin" cx="238" cy="117" r="4.41"/>'
    if key in {'west-straight', 'north-straight'}:
        angle = 180 if orientation == 'l' else 90
        label = name.upper()
        geometry += (f'<text class="yas-straight-label" x="{source.real:.2f}" y="{source.imag:.2f}"'
                     f' transform="rotate({angle} {source.real:.2f} {source.imag:.2f})"'
                     f' text-anchor="middle" dominant-baseline="central" pointer-events="none" aria-hidden="true">{label}</text>')
    return (f'<g class="sector yas-map-zone" data-sector="{key}" transform="{transform}"'
            f' role="button" tabindex="0" aria-label="{name}">{geometry}</g>')


extra = {key: group for key, group in sectors(LATEST).items() if key not in original}
assert set(original) | extra.keys() == CATALOG.keys()
assert TRACKSIDE_POSITIONS.keys() <= extra.keys()


def update_svg(match):
    svg = match[0]
    orientation = 'l' if 'data-orient="l"' in svg else 'p'
    pivot = f'{ILLUSTRATION_PIVOT.real:g} {ILLUSTRATION_PIVOT.imag:g}'
    transform = f' transform="rotate(-90 {pivot})"' if orientation == 'l' else ''
    zones = '\n'.join(draw_zone(key, group, orientation) for key, group in extra.items())
    layer = f'<g class="yas-zone-layer"{transform}>\n{zones}\n</g>'
    svg, updated = re.subn(r'<g class="(?:catalog-marker|yas-zone)-layer"[^>]*>[\s\S]*</g>(?=</svg>)',
                           lambda _: layer, svg)
    assert updated == 1
    assert sectors(ET.fromstring(svg)).keys() == CATALOG.keys()
    return svg


for asset in [SCHEMES / 'widget-yas.html', MAPS / 'yas-marina-reference.html']:
    asset.write_text(re.sub(SVG_PATTERN, update_svg, asset.read_text()))
