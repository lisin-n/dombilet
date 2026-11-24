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
    'club58': (1270, 1316),
    'yas-suite-west': (1458, 1374),
    'lounge-west': (1480, 1442),
    'west-club': (1540, 1367),
    'turn-at-west': (1636, 1312),
    'marsa-suite': (1810, 1216),
    'deck-at-9': (1906, 613),
    'south-club': (2134, 688),
    'marina-views-suite': (1899, 1142),
    'north-straight': (718, 1100),
    'wow-suite': (1620, 796),
    'yacht-hospitality': (1752, 958),
    'terrace': (1294, 777),
    'yas-suite-main': (1322, 1009),
    'yas-suite-main-premium': (1326, 1086),
    'deck-at-2': (1030, 828),
    'sunset-lounge': (696, 862),
    'trackside-at-sunset-lounge': (658, 864),
    'yas-suite-north': (405, 883),
    'lounge-north': (349, 1060),
    'shams-suite': (565, 1101),
    'north-straight-premium': (702, 1131),
    '16-360-the-terrace-collection': (1368, 1190),
}

# Keep visible gaps in the narrow roadside strips, bays and terrace cluster.
ZONE_SCALE = {
    'club58': .44,
    'yas-suite-west': .44,
    'wow-suite': .60,
    'yas-suite-main': .80,
    'sunset-lounge': .63,
    'trackside-at-sunset-lounge': .63,
    'terrace-right': .85,
    'courtyard': .85,
    'terrace-left': .85,
}

# The House and The House Premium share a bend. The outlines follow the
# illustrated track at a constant offset, with a gap between the end caps.
CURVED_TRACKSIDE_OUTLINES = {
    'the-house': (
        'M1318.37 1714.00 C1332.69 1721.16 1344.57 1725.89 1359.63 1731.28 '
        'Q1365.18 1733.26 1367.17 1727.61 L1371.83 1714.40 '
        'Q1373.83 1708.75 1368.39 1706.80 '
        'C1353.32 1701.41 1344.31 1697.90 1330.00 1690.75 '
        'Q1325.24 1688.37 1322.49 1693.70 L1316.07 1706.14 '
        'Q1313.32 1711.47 1318.37 1714.00 Z'
    ),
    'the-house-premium': (
        'M1379.66 1738.14 C1387.58 1740.71 1394.75 1742.90 1402.76 1745.22 '
        'Q1408.36 1746.80 1409.99 1741.03 L1413.79 1727.56 '
        'Q1415.42 1721.78 1409.99 1720.25 '
        'C1401.98 1717.93 1395.58 1715.97 1387.65 1713.40 '
        'Q1382.54 1711.70 1380.63 1717.39 L1376.17 1730.66 '
        'Q1374.26 1736.35 1379.66 1738.14 Z'
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
    placement = rotation * ZONE_SCALE.get(key, 1)
    origin = centre - placement * source
    transform = f'matrix({placement.real:.5f} {placement.imag:.5f} {-placement.imag:.5f} {placement.real:.5f} {origin.real:.2f} {origin.imag:.2f})'
    geometry = ''.join(render_geometry(group))
    if key in {'yas-suite-main-premium', 'trackside-at-sunset-lounge'}:
        # The original star is cut out of the dot. Its centre should still respond to taps.
        geometry = (f'<circle class="yas-zone-hit" cx="{source.real:.2f}" cy="{source.imag:.2f}" r="4.41"/>'
                    + geometry)
    if key == '16-360-the-terrace-collection':
        # One marker leaves room for the three separately bookable terraces.
        geometry = (f'<circle class="sec-shape zone-shape yas-collection-pin"'
                    f' cx="{source.real:.2f}" cy="{source.imag:.2f}" r="4.41"/>')
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
assert ZONE_SCALE.keys() <= extra.keys()
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
