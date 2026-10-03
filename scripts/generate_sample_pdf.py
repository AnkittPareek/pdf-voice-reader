"""
Generates a rich, multi-page sample PDF for testing PDF Voice Reader on the Android emulator.
Includes titles, chapter headers, multiple paragraphs, bullet points, and page numbers.
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_pdf(output_path: str):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Title'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=30,
        textColor=colors.HexColor('#1E1B4B'),
        spaceAfter=14
    )
    
    author_style = ParagraphStyle(
        'DocAuthor',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#6366F1'),
        spaceAfter=24
    )
    
    h1_style = ParagraphStyle(
        'ChapterHeader',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#1E1B4B'),
        spaceBefore=12,
        spaceAfter=14
    )
    
    body_style = ParagraphStyle(
        'BookBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=17,
        textColor=colors.HexColor('#1F2937'),
        spaceAfter=14
    )
    
    bullet_style = ParagraphStyle(
        'BookBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=16,
        textColor=colors.HexColor('#374151'),
        leftIndent=20,
        spaceAfter=8
    )
    
    story = []
    
    # --- PAGE 1 ---
    story.append(Paragraph("The Art of Mindful Reading", title_style))
    story.append(Paragraph("By Dr. Marcus Vance &bull; Essential Companion Series", author_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph("Chapter 1: The Resurgence of Spoken Words", h1_style))
    story.append(Paragraph(
        "In an era characterized by relentless screen exposure, the human mind seeks alternate pathways to consume knowledge. "
        "Spoken audio offers a sanctuary for the weary gaze. When words are voiced with clarity and precision, "
        "comprehension deepens without inducing visual exhaustion.",
        body_style
    ))
    story.append(Paragraph(
        "This reading companion bridges the tactile clarity of written prose with the effortless flow of speech. "
        "As you journey through each chapter, observe how pacing and emphasis transform silent glyphs into vibrant mental imagery. "
        "Every paragraph has been crafted to test cadence, rhythm, and lexical nuance.",
        body_style
    ))
    story.append(Paragraph(
        "Listening is not passive consumption; it is an active dialogue between the author's thoughts and your personal imagination. "
        "When voice meets text in synchronized harmony, reading becomes an immersive ritual.",
        body_style
    ))
    
    story.append(PageBreak())
    
    # --- PAGE 2 ---
    story.append(Paragraph("Chapter 2: The Rhythm of Attention", h1_style))
    story.append(Paragraph(
        "Human attention ebbs and flows like ocean tides. Traditional paper books demand complete visual commitment, "
        "anchoring the reader to a static posture. Audio reading liberates physical movement.",
        body_style
    ))
    story.append(Paragraph(
        "Whether you are taking an afternoon stroll, resting your eyes during twilight, or reviewing research while commuting, "
        "sound accompanies your natural rhythm. The mind remains fully engaged while the body moves freely.",
        body_style
    ))
    story.append(Paragraph("Consider these core benefits of auditory literature:", body_style))
    story.append(Paragraph("&bull; First, it dramatically reduces digital eye strain caused by hours of artificial blue light.", bullet_style))
    story.append(Paragraph("&bull; Second, hearing natural speech cadence enhances pronunciation and language retention.", bullet_style))
    story.append(Paragraph("&bull; Third, adjustable playback speed tailors each sentence to your personal cognitive processing speed.", bullet_style))
    story.append(Paragraph(
        "With speed controls ranging from three-quarters pace to double tempo, you dictate the velocity of knowledge acquisition.",
        body_style
    ))
    
    story.append(PageBreak())
    
    # --- PAGE 3 ---
    story.append(Paragraph("Chapter 3: Sovereign Privacy and Architecture", h1_style))
    story.append(Paragraph(
        "Your reading library is an intimate mirror of your intellect, curiosities, and personal growth. "
        "In the modern cloud landscape, too many applications extract your private annotations and reading habits to build commercial profiles.",
        body_style
    ))
    story.append(Paragraph(
        "True intellectual freedom requires local sovereignty. Every document opened within this application remains strictly confined to your physical device. "
        "No network transmission takes place behind closed curtains.",
        body_style
    ))
    story.append(Paragraph(
        "No telemetry monitors your progress. No external cloud server reconstructs your pages. "
        "No unauthorized algorithms peer over your shoulder as you turn the page.",
        body_style
    ))
    story.append(Paragraph(
        "Experience the profound peace of mind that comes from true offline autonomy. Here, your books belong entirely to you.",
        body_style
    ))
    
    story.append(PageBreak())
    
    # --- PAGE 4 ---
    story.append(Paragraph("Chapter 4: The Path Forward", h1_style))
    story.append(Paragraph(
        "As technology continues to accelerate, the timeless craft of deep reading must be preserved. "
        "Whether you are consuming historical treatises, scientific journals, classic fiction, or daily study notes, "
        "allow your ears to shoulder the burden of decoding text.",
        body_style
    ))
    story.append(Paragraph(
        "Experiment with different reading speeds to find your sweet spot. Some dense philosophy demands a deliberate one-times pace, "
        "while brisk narrative fiction effortlessly glides at one-point-five.",
        body_style
    ))
    story.append(Paragraph(
        "Remember that you can tap any sentence on the screen at any moment to begin listening right from that exact point. "
        "Switch between reflow text and the original layout whenever you desire visual fidelity.",
        body_style
    ))
    story.append(Paragraph(
        "Turn the page, immerse yourself in the cadence of speech, and rediscover the timeless joy of listening.",
        body_style
    ))
    
    doc.build(story)
    print(f"Successfully generated PDF: {output_path}")

if __name__ == '__main__':
    target = os.path.abspath("tests/fixtures/The_Art_of_Mindful_Reading.pdf")
    generate_pdf(target)
