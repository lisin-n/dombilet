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
    'club58': (1253, 1375),
    'yas-suite-west': (1444, 1433),
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
    'north-straight-premium': (704, 1130),
}

# The House and The House Premium share a bend. The outlines follow the
# illustrated track at a constant offset, with a gap between the end caps.
CURVED_TRACKSIDE_OUTLINES = {
    'the-house': (
        'M1316.59 1717.58 C1330.90 1724.73 1343.22 1729.66 1358.28 1735.05 '
        'Q1363.84 1737.04 1365.84 1731.38 L1370.50 1718.18 '
        'Q1372.50 1712.52 1367.04 1710.57 '
        'C1351.98 1705.18 1342.52 1701.48 1328.21 1694.32 '
        'Q1323.40 1691.92 1320.65 1697.26 L1314.23 1709.70 '
        'Q1311.48 1715.03 1316.59 1717.58 Z'
    ),
    'the-house-premium': (
        'M1378.42 1741.95 C1386.35 1744.51 1393.64 1746.75 1401.65 1749.06 '
        'Q1407.27 1750.65 1408.90 1744.88 L1412.71 1731.40 '
        'Q1414.34 1725.63 1408.88 1724.09 '
        'C1400.87 1721.77 1394.35 1719.77 1386.42 1717.21 '
        'Q1381.26 1715.49 1379.35 1721.18 L1374.89 1734.45 '
        'Q1372.98 1740.14 1378.42 1741.95 Z'
    ),
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
    name = html.escape(CATALOG[key]['name'], quote=True)
    markup = f'<g class="sector yas-map-zone" data-sector="{key}"'
    accessible = f' role="button" tabindex="0" aria-label="{name}"'
    if key in CURVED_TRACKSIDE_OUTLINES:
        return f'{markup}{accessible}><path class="sec-shape zone-shape" d="{CURVED_TRACKSIDE_OUTLINES[key]}"/></g>'

    source = source_center(key)
    if key in TRACKSIDE_POSITIONS:
        landscape = complex(*TRACKSIDE_POSITIONS[key])
        centre = ILLUSTRATION_PIVOT + 1j * (landscape - ILLUSTRATION_PIVOT)
    else:
        anchor = ZONES[key]['parent'] or min(anchors, key=lambda item: abs(source - source_center(item)))
        centre = anchors[anchor] + rotation * (source - source_center(anchor))
    origin = centre - rotation * source
    transform = f'matrix({rotation.real:.5f} {rotation.imag:.5f} {-rotation.imag:.5f} {rotation.real:.5f} {origin.real:.2f} {origin.imag:.2f})'
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
    return f'{markup} transform="{transform}"{accessible}>{geometry}</g>'


extra = {key: group for key, group in sectors(LATEST).items() if key not in original}
assert set(original) | extra.keys() == CATALOG.keys()
assert TRACKSIDE_POSITIONS.keys() <= extra.keys()
assert CURVED_TRACKSIDE_OUTLINES.keys() <= extra.keys()


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
