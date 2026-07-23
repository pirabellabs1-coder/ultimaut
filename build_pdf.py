# -*- coding: utf-8 -*-
import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
                                PageBreak, HRFlowable)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

_MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
         'août', 'septembre', 'octobre', 'novembre', 'décembre']
_NOW = datetime.now()
DATE_FR = "%s %d" % (_MOIS[_NOW.month - 1].capitalize(), _NOW.year)

BLUE = HexColor("#1565C0"); DEEP = HexColor("#0F4C92"); LIME = HexColor("#8BC53F")
INK = HexColor("#1F2A37"); MUTED = HexColor("#64748B"); LIGHT = HexColor("#F4F7FB")
ROW = HexColor("#FBFCFE"); LINE = HexColor("#E2E8F0")

ss = getSampleStyleSheet()
body = ParagraphStyle('body', parent=ss['Normal'], fontName='Helvetica', fontSize=10.3,
                      leading=15.5, textColor=INK, spaceAfter=7)
muted = ParagraphStyle('muted', parent=body, textColor=MUTED, fontSize=9.5, leading=14)
cell = ParagraphStyle('cell', parent=body, fontSize=9.6, leading=13, spaceAfter=0)
h1 = ParagraphStyle('h1', parent=ss['Heading1'], fontName='Helvetica-Bold', fontSize=16,
                    textColor=BLUE, spaceBefore=4, spaceAfter=4, leading=20)
h2 = ParagraphStyle('h2', parent=ss['Heading2'], fontName='Helvetica-Bold', fontSize=11.5,
                    textColor=INK, spaceBefore=10, spaceAfter=3, leading=15)
bullet = ParagraphStyle('bullet', parent=body, leftIndent=14, bulletIndent=2, spaceAfter=5)
lead = ParagraphStyle('lead', parent=body, fontSize=11, leading=16.5, textColor=HexColor("#334155"))

def section(title):
    return [Paragraph(title, h1),
            HRFlowable(width="100%", thickness=2.4, color=LIME, spaceBefore=2, spaceAfter=10,
                       lineCap='round')]

def bullets(items):
    return [Paragraph(t, bullet, bulletText='•') for t in items]

def kv_table(rows, col_widths, header=True, total_row=False):
    t = Table(rows, colWidths=col_widths, hAlign='LEFT')
    style = [('FONT', (0,0), (-1,-1), 'Helvetica', 10),
             ('TEXTCOLOR', (0,0), (-1,-1), INK),
             ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
             ('TOPPADDING', (0,0), (-1,-1), 7), ('BOTTOMPADDING', (0,0), (-1,-1), 7),
             ('LEFTPADDING', (0,0), (-1,-1), 11), ('RIGHTPADDING', (0,0), (-1,-1), 11),
             ('LINEBELOW', (0,0), (-1,-1), 0.6, LINE),
             ('ROWBACKGROUNDS', (0,1 if header else 0), (-1,-1), [white, ROW])]
    if header:
        style += [('BACKGROUND', (0,0), (-1,0), BLUE), ('TEXTCOLOR', (0,0), (-1,0), white),
                  ('FONT', (0,0), (-1,0), 'Helvetica-Bold', 10.3)]
    if total_row:
        style += [('BACKGROUND', (0,-1), (-1,-1), LIGHT), ('FONT', (0,-1), (-1,-1), 'Helvetica-Bold', 10.3),
                  ('TEXTCOLOR', (0,-1), (-1,-1), DEEP)]
    t.setStyle(TableStyle(style))
    return t

def stat(num, label):
    return Paragraph(f'<font size=21 color="#1565C0"><b>{num}</b></font><br/>'
                     f'<font size=8 color="#64748b">{label}</font>', ParagraphStyle('s', alignment=TA_CENTER, leading=24))

def footer(canvas, doc):
    if canvas.getPageNumber() == 1:
        return
    canvas.saveState()
    canvas.setStrokeColor(LINE); canvas.setLineWidth(0.6)
    canvas.line(20*mm, 16*mm, 190*mm, 16*mm)
    canvas.setFont('Helvetica', 8); canvas.setFillColor(MUTED)
    canvas.drawString(20*mm, 11*mm, "Pirabel Labs  ·  contact@pirabellabs.com  ·  ultimauto.fr")
    canvas.drawRightString(190*mm, 11*mm, "Page %d" % canvas.getPageNumber())
    canvas.restoreState()

story = []

# ---------- COUVERTURE ----------
cover_inner = [
    [Paragraph('<font color="#cfe0f5" size=11><b>PIRABEL LABS</b></font>', ParagraphStyle('c1', alignment=TA_CENTER))],
    [Paragraph('<font color="white" size=40><b>ULTIMAUTO</b></font>', ParagraphStyle('c2', alignment=TA_CENTER, leading=46))],
    [Paragraph('<font color="#9bdb4d" size=15><b>Refonte du site web &amp; référencement</b></font>', ParagraphStyle('c3', alignment=TA_CENTER, leading=22))],
    [Paragraph('<font color="white" size=12>Présentation des livrables et de l’accompagnement</font>', ParagraphStyle('c4', alignment=TA_CENTER, leading=18))],
]
band = Table(cover_inner, colWidths=[170*mm])
band.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),BLUE),('TOPPADDING',(0,0),(-1,0),34),
                          ('BOTTOMPADDING',(0,-1),(-1,-1),34),('TOPPADDING',(0,1),(-1,-1),6),
                          ('BOTTOMPADDING',(0,0),(-1,-2),6),('LEFTPADDING',(0,0),(-1,-1),16),('RIGHTPADDING',(0,0),(-1,-1),16)]))
story += [Spacer(1, 40*mm), band, Spacer(1, 16*mm)]
info = [
    ["Client", "Ultimauto — Multiservices Automobile · Cholet (49)"],
    ["Site en ligne", "ultimauto.fr"],
    ["Préparé par", "Pirabel Labs"],
    ["Date", DATE_FR],
]
it = Table([[Paragraph(f'<b>{k}</b>', muted), Paragraph(v, body)] for k,v in info], colWidths=[38*mm, 132*mm], hAlign='CENTER')
it.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'MIDDLE'),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),
                        ('LINEBELOW',(0,0),(-1,-1),0.5,LINE)]))
story += [it, PageBreak()]

# ---------- 1. LE NOUVEAU SITE ----------
story += section("1.  Un nouveau site, entièrement repensé")
story += [Paragraph("Votre ancien site a été intégralement refondu en un site web moderne, ultra-rapide et "
                    "optimisé pour le référencement. L’objectif : faire d’ultimauto.fr votre meilleur "
                    "commercial — visible 24h/24 sur Google dans tout le Grand Ouest.", lead), Spacer(1,6)]
stats = Table([[stat("580","pages publiées"), stat("43","guides experts"),
                stat("100/100","SEO &amp; accessibilité*"), stat("5","départements (44·49·56·79·85)")]],
              colWidths=[42.5*mm]*4)
stats.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),LIGHT),('BOX',(0,0),(-1,-1),0.5,LINE),
                           ('INNERGRID',(0,0),(-1,-1),0.5,white),('TOPPADDING',(0,0),(-1,-1),12),('BOTTOMPADDING',(0,0),(-1,-1),12)]))
story += [stats, Paragraph("* score Google Lighthouse (référencement, accessibilité, bonnes pratiques).", muted), Spacer(1,8)]
story += [Paragraph("Répartition des pages", h2)]
story += [kv_table([
    ["Type de page", "Nombre"],
    [Paragraph("Pages locales (chaque service × chaque ville — 113 communes)", cell), "450"],
    [Paragraph("Fiches « code défaut moteur » (OBD)", cell), "47"],
    [Paragraph("Fiches « problème AdBlue » par marque", cell), "21"],
    [Paragraph("Articles de blog (guides détaillés)", cell), "43"],
    [Paragraph("Pages de services (décalaminage, FAP, reprogrammation, AdBlue)", cell), "4"],
    [Paragraph("Pages essentielles et index de sections", cell), "15"],
    ["Total", "580"],
], [150*mm, 20*mm], header=True, total_row=True)]
story += [Spacer(1,8), Paragraph("Fonctionnalités du site", h2)]
story += bullets([
    "Prise de rendez-vous en ligne",
    "Formulaire de contact (envoi direct vers vos e-mails)",
    "Bouton WhatsApp et appel en un clic",
    "Simulateur de gain de puissance (reprogrammation Stage 1)",
    "Page avis clients (4,9/5 · 450 avis Google)",
    "Bandeau d’annonce pilotable (absence, promo…) et mode maintenance",
    "Affichage parfait sur mobile, tablette et ordinateur",
])
story += [PageBreak()]

# ---------- 2. TECHNIQUE & SEO ----------
story += section("2.  Le travail technique &amp; référencement (SEO)")
def block(title, txt):
    return [Paragraph(title, h2), Paragraph(txt, body)]
story += block("Référencement local — 450 pages dédiées",
    "Une page par service et par ville : vous apparaissez sur des recherches comme « décalaminage Cholet », "
    "« nettoyage FAP Angers » ou « reprogrammation Nantes », dans les 5 départements (44·49·56·79·85).")
story += block("Contenu éditorial — 43 guides experts",
    "Des articles de fond qui répondent aux vraies questions de vos clients (symptômes, prix, "
    "comparatifs). Ils attirent un trafic qualifié et renforcent votre crédibilité auprès de Google.")
story += block("Pages techniques — 47 codes défaut + 21 marques AdBlue",
    "68 fiches ultra-ciblées : chaque code défaut moteur (P2002, P20EE, P244A…) et chaque marque pour "
    "l’AdBlue capte des recherches très précises que la concurrence locale ne couvre pas.")
story += block("Performance &amp; technique",
    "Site « statique » diffusé par un réseau mondial (CDN) → chargement quasi instantané. Données structurées "
    "Schema.org → éligibilité aux résultats enrichis Google. HTTPS, plan de site (sitemap) et sécurité renforcée.")
story += block("Migration de l’ancien site — 264 redirections (301)",
    "Toutes les anciennes adresses ont été redirigées automatiquement vers les nouvelles pages. L’autorité et "
    "le référencement déjà acquis par l’ancien site sont ainsi transférés vers le nouveau, sans perte.")
story += block("Mesure d’audience &amp; conformité",
    "Google Analytics et Search Console (Google) + Bing Webmaster Tools et IndexNow pour une indexation rapide. "
    "Mentions légales, CGV et politique de confidentialité conformes au RGPD.")
story += [PageBreak()]

# ---------- 3. SUIVI & ACCOMPAGNEMENT ----------
story += section("3.  Le suivi &amp; l’accompagnement en cours")
story += [Paragraph("Un site performant se construit dans la durée. Voici l’accompagnement assuré en continu pour "
                    "faire progresser votre visibilité, mois après mois — un suivi qui vous est offert :", lead), Spacer(1,4)]
story += bullets([
    "<b>Suivi de l’indexation</b> — je vérifie que Google et Bing explorent et référencent bien chaque page.",
    "<b>Surveillance technique</b> — disponibilité du site, redirections, erreurs éventuelles, sécurité et sauvegardes.",
    "<b>Suivi des performances</b> — trafic, mots-clés, positions et comportement des visiteurs (Google Analytics).",
    "<b>Production de contenu</b> — publication régulière de nouveaux guides pour capter davantage de recherches.",
    "<b>Optimisation continue</b> — ajustement des pages, fiche Google Business et incitation aux avis clients.",
    "<b>Support &amp; évolutions</b> — corrections, ajouts de fonctionnalités et conseils selon vos besoins.",
])
story += [Spacer(1,8), Paragraph("Feuille de route", h2)]
story += [kv_table([
    ["Période", "Objectif"],
    ["Mois 1", "Indexation des pages par Google, mise en place du suivi, premiers retours."],
    ["Mois 1 à 3", "Montée progressive des positions locales, publication de contenu."],
    ["Mois 3 à 6", "Croissance du trafic organique, consolidation sur les requêtes clés."],
], [30*mm, 140*mm], header=True)]
story += [PageBreak()]

# ---------- 4. POTENTIEL & INVESTISSEMENT ----------
story += section("4.  Potentiel &amp; investissement")
story += [Paragraph("Comparaison avec l’ancien site", h2)]
story += [kv_table([
    ["", "Ancien site", "Nouveau site"],
    ["Pages référençables", "~ 100", "580  (× 6)"],
    ["Articles de fond", "quelques-uns", "43"],
    ["Pages locales ciblées", "une poignée", "450"],
    ["Fiches techniques", "aucune", "68"],
    ["Note technique Google", "moyenne", "100/100"],
], [70*mm, 50*mm, 50*mm], header=True)]
story += [Spacer(1,8), Paragraph("<b>Résultat déjà constaté</b>", h2)]
story += [Paragraph("En quelques semaines, le trafic est passé d’environ <b>1 000 visites par mois</b> à "
        "<b>plus de 150 visiteurs par jour</b> (environ 4 500 par mois), avec une position moyenne de "
        "<b>7,9</b> sur Google. La croissance se poursuit à mesure que Google indexe les pages.", lead)]
story += [Spacer(1,4), Paragraph("Le référencement monte en puissance sur 3 à 6 mois, puis la croissance se cumule "
        "avec le contenu publié et les avis clients. Le nouveau site offre une base 6 fois plus large et "
        "techniquement irréprochable : le plafond de visibilité est sans commune mesure avec l’ancien.", body)]
story += [Spacer(1,10), Paragraph("Investissement", h2)]
story += [kv_table([
    ["Prestation", "Montant"],
    [Paragraph("Création du site — 580 pages, 43 articles, 68 fiches techniques, référencement (SEO), migration (264 redirections) et intégrations", cell), "2 000 €"],
    [Paragraph("Suivi et accompagnement (contenu, optimisation, support)", cell), "Offert"],
    ["Total", "2 000 €"],
], [125*mm, 45*mm], header=True, total_row=True)]
story += [Spacer(1,6), Paragraph("Le montant de <b>2 000 €</b> couvre l’intégralité de la création du site : "
        "580 pages, contenu rédactionnel, référencement (SEO), migration complète de l’ancien site et intégrations. "
        "Le suivi et l’accompagnement en cours (contenu, avis, optimisation, support) vous sont <b>offerts</b>.", muted)]

# ---------- BUILD ----------
candidates = [os.path.join(os.path.expanduser("~"), "Desktop"),
              os.path.join(os.path.expanduser("~"), "OneDrive", "Desktop"),
              os.path.expanduser("~")]
outdir = next((d for d in candidates if os.path.isdir(d)), os.path.expanduser("~"))
out = os.path.join(outdir, "Ultimauto-Presentation-Client.pdf")

from io import BytesIO
buf = BytesIO()
doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=20*mm, rightMargin=20*mm,
                        topMargin=18*mm, bottomMargin=22*mm,
                        title="Ultimauto — Présentation site web & accompagnement", author="Pirabel Labs")
doc.build(story, onFirstPage=footer, onLaterPages=footer)
data = buf.getvalue()
written = None
for path in [out, out[:-4] + "-MAJ.pdf", out[:-4] + "-v3.pdf"]:
    try:
        with open(path, "wb") as fh:
            fh.write(data)
        written = path
        break
    except PermissionError:
        continue
print("PDF cree :", written or "ECHEC (fermez le PDF ouvert puis relancez)")
