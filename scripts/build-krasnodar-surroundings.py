"""Build the arena's north-up schematic. Layout follows the aerial survey,
the gmp stadium site plan and the club academy's published location plan.
Drawing units follow the north-up aerial reference, with the pitch at (577,443).
"""
from math import cos, sin, radians
from pathlib import Path
import re
import xml.etree.ElementTree as ET

BASE = Path(__file__).resolve().parents[1] / 'site/schemes'
MAPS = BASE / 'assets/maps'
GREEN, PALE, LAWN = '#cfdbc2', '#e4ead9', '#bccfb0'
STONE, WALK, ROOF, WATER = '#e9e2d5', '#faf7ef', '#d3cfc8', '#b6d4d9'
art = []


def path(d, fill='none', stroke='none', width=1):
    art.append(f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{width}" stroke-linejoin="round"/>')


def rect(x, y, w, h, color, angle=0):
    art.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="0.8" fill="{color}" transform="rotate({angle} {x+w/2} {y+h/2})"/>')


def ellipse(x, y, a, b, fill, stroke='none', width=1):
    art.append(f'<ellipse cx="{x}" cy="{y}" rx="{a}" ry="{b}" fill="{fill}" stroke="{stroke}" stroke-width="{width}"/>')


# Local blocks and the principal streets framing the precinct.
rect(-600,-600,3000,2500,'#edeae3')
path('M-400 -380 H368 L399 278 424 650 268 661 -380 350Z', PALE)
for d in ['M-320 321 L399 280','M-250 187 L392 157','M-260 77 L381 46','M-80 480 L405 445',
          'M-170 399 L425 765','M8 824 L288 646','M88 79 L137 514','M175 34 L210 574',
          'M264 22 L285 644','M-80 44 L-28 460','M405 158 L969 157','M777 -170 V278','M969 -150 V280']:
    path(d,stroke=WALK,width=5)
# West of the boulevard are small residential plots. Group roofs by block.
for x,y in [(238,235),(316,215),(320,314),(243,335),(324,460),(252,473),(323,552),
            (150,213),(145,355),(69,348),(85,229),(34,111),(219,103),(302,96)]:
    for dx,dy,w,h in [(0,0,12,9),(20,-3,9,14),(43,2,13,10),(4,25,11,13),(29,23,16,9),(51,28,9,12)]:
        rect(x+dx,y+dy,w,h,ROOF,-5)
# Perimeter apartment buildings north of the stadium and academy.
for x,y,w,h in [(425,178,72,73),(529,177,108,73),(670,177,101,100),(850,172,82,100),
                (428,78,75,78),(551,68,89,85),(680,73,83,79),(858,57,87,94)]:
    path(f'M{x} {y}h17v{h-14}h{w-17}v14h-{w}Z',ROOF,'#c6c2bb',1)
    rect(x+w-17,y-12,17,h,ROOF)
path('M414 280 Q418 262 443 262 H624 Q649 262 663 280 L678 297 H963',stroke=WALK,width=8)
# The plaza is elliptical on the west and straight along the academy on the east.
path('M426 264 H623 Q650 264 663 280 L694 304 697 597 651 640 453 653Z',STONE)
def polar(rx,ry,a):
    return f'{578+rx*cos(radians(a)):.1f} {442+ry*sin(radians(a)):.1f}'
def band(inner,outer,start,end,color):
    path(f'M{polar(*outer,start)} A{outer[0]} {outer[1]} 0 0 1 {polar(*outer,end)} L{polar(*inner,end)} A{inner[0]} {inner[1]} 0 0 0 {polar(*inner,start)}Z',color)
for rx,ry,stroke,width in [(131,161,'#d8d1c2',1.6),(119,145,WALK,8)]:
    path(f'M{polar(rx,ry,52)} A{rx} {ry} 0 1 1 {polar(rx,ry,308)}',stroke=stroke,width=width)
for a in range(52,308,14):
    band((88,104),(108,134),a,min(308,a+10.5),GREEN)
for a in range(56,305,4):
    path(f'M{polar(121,148,a)} L{polar(130,159,a)}',stroke='#d2cbbb',width=.65)
path('M631 347 L682 301 684 572 632 539 Q679 444 631 347Z','#e2d9c8','#d3c9b7',1.5)
path('M685 302 L687 572',stroke=WALK,width=4)
# Academy buildings and training grounds northeast of the pitch.
path('M698 302 H955 V435 H844 L802 401 H697Z',PALE)
for x in (710,751,794,841,903):
    rect(x,305,35,10,ROOF)
for y,offset in [(344,0),(377,-6)]:
    for x in (738,779,820,861):
        rect(x+offset-11,y-10,22,20,ROOF,-44)
path('M926 339 L951 332 953 401 903 403 Q924 375 926 339Z',ROOF)
rect(878,405,72,29,'#c4d3d0')
for y in (21,156,241,338):
    rect(987,y,74,73,LAWN)
    rect(1067,y,63,73,LAWN)
# Southern garden fans, circular gardens, and the broad pedestrian approaches.
path('M453 652 Q560 659 652 631 L697 595 V399 H824 Q848 402 867 434 H980 V633 H1140 L1134 685 833 961 484 968Z',GREEN)
for a in range(53,128,5):
    band((160,188),(248,315),a,a+3.5,LAWN)
    path(f'M{polar(148,175,a)} L{polar(270,349,a)}',stroke=WALK,width=2.4)
path('M455 657 Q579 785 729 644 Q781 597 802 548 M456 758 Q572 832 677 792',stroke=WALK,width=6)
path('M455 639 Q579 667 651 633 L732 572',stroke=WALK,width=11)
path('M697 400 V596 M982 394 V633 H1160',stroke=WALK,width=6)
# Infinity and Fast River share a winding perimeter walk.
path('M705 436 C724 405 770 403 792 426 S824 461 861 451 S925 439 947 471 M707 460 C723 425 767 418 786 445 S819 489 852 475 S912 453 933 483',stroke=WALK,width=3.4)
for x,y,r in [(755,471,38),(891,507,35),(804,548,49),(735,574,20),(892,577,23),(765,703,54),(888,748,38)]:
    ellipse(x,y,r,r,LAWN,WALK,3)
    ellipse(x,y,r*.77,r*.77,'none',PALE,2)
ellipse(755,471,19,19,GREEN)
path('M741 465 A15 15 0 0 1 770 470',stroke=WATER,width=5)
ellipse(804,548,16,16,WATER,WALK,2.5)
path('M868 506 A23 23 0 1 1 911 516 M874 506 A17 17 0 1 1 902 519',stroke=WATER,width=3)
path('M834 595 C873 561 860 537 844 508 M833 597 Q810 622 860 614 H979',stroke=WALK,width=4)
ellipse(765,703,41,41,WATER,WALK,4)
ellipse(780,703,24,24,LAWN,WALK,3)
path('M675 735 Q728 847 824 779 T947 694',stroke=WALK,width=6)
# Divided boulevard and its green median. Through roads do not cross the plaza.
blvd='M365 -240 Q384 90 404 278 L429 629 Q437 786 467 948 L489 1150'
for stroke,width in [('#c5c5bd',23),(WALK,21),('#d5d5ce',16),(LAWN,4)]:
    path(blvd,stroke=stroke,width=width)
path('M-280 325 L400 281',stroke=WALK,width=7)
labels=[]
def label(x,y,title,angle=0,size=7):
    labels.append(f'<text transform="translate({x} {y}) rotate({angle})" style="font-size:{size}px;stroke-width:1.7px">{title}</text>')
label(421,490,'Восточно-Кругликовская улица',86)
label(308,285,'ул. Жлобы',-4)
label(774,398,'Академия ФК «Краснодар»',0,7.2)
label(755,492,'Инфинити')
label(804,570,'Кратер')
label(891,532,'Стремительная река')
label(1000,633,'ул. Разведчика Леонова')
label(589,632,'Парк «Краснодар»',0,9)
scenery=''.join(art)+'<g class="surrounding-labels" text-anchor="middle">'+''.join(labels)+'</g>'

# Use the supplied north-up bowl, including its already upright seat numbers.
portrait=(MAPS/'krasnodar-reference-mobile.html').read_text()
bowl=portrait[portrait.index('<g class="kras-stadium"'):portrait.rindex('</svg>')]
bowl=re.sub(r'(<g class="kras-stadium" transform=")[^"]+',r'\g<1>translate(204 43) scale(0.665)',bowl,count=1)
for mobile in (False,True):
    variant='mobile' if mobile else 'desktop'
    asset=MAPS/('krasnodar-reference-mobile.html' if mobile else 'krasnodar-reference.html')
    view='-65 -185 1100 1100' if mobile else '-215 -135 1400 1000'
    svg=(f'<svg xmlns="http://www.w3.org/2000/svg" class="map-svg krasnodar-svg krasnodar-{variant}" '
         f'data-orient="stadium{"-p" if mobile else ""}" viewBox="{view}" role="group" aria-label="Ozon Арена, схема секторов и парк Краснодар">'
         '<g class="kras-landscape" pointer-events="none" aria-hidden="true" transform="translate(485 365) scale(3.22) translate(-577 -443)">'
         +scenery+'</g>'+bowl+'</svg>')
    ET.fromstring(svg)
    asset.write_text(svg)
    if not mobile:
        widget=BASE/'widget-krasnodar.html'
        result,n=re.subn(r'<svg\b(?=[^>]*krasnodar-desktop)[^>]*>.*?</svg>',lambda _:svg,widget.read_text(),flags=re.S)
        assert n==1
        widget.write_text(result)
