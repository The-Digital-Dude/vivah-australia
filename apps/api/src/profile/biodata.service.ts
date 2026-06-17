import PDFDocument from 'pdfkit';

// Brand colours (RGB)
const MAROON: [number, number, number] = [161, 14, 77];
const GOLD: [number, number, number] = [212, 160, 76];
const IVORY: [number, number, number] = [255, 249, 245];
const CHARCOAL: [number, number, number] = [47, 47, 47];
const WHITE: [number, number, number] = [255, 255, 255];
const LIGHT_GREY: [number, number, number] = [230, 230, 230];
const MID_GREY: [number, number, number] = [120, 120, 120];

const PAGE_MARGIN = 50;
const PAGE_WIDTH = 595.28;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

export interface BiodataProfileInput {
  displayId: string;
  photoUrl?: string;
  personal?: {
    firstName?: string;
    lastName?: string;
    age?: number;
    gender?: string;
    maritalStatus?: string;
    heightCm?: number;
  };
  location?: {
    city?: string;
    state?: string;
    country?: string;
    suburb?: string;
    visaStatus?: string;
  };
  religion?: {
    religion?: string;
    community?: string;
    motherTongue?: string;
    languagesSpoken?: string[];
  };
  education?: { highestQualification?: string };
  employment?: {
    occupation?: string;
    industry?: string;
    employerName?: string;
  };
  family?: {
    familyValues?: string;
    familyType?: string;
    fatherDetails?: string;
    motherDetails?: string;
    siblingDetails?: string;
  };
  lifestyle?: {
    dietaryPreferences?: string;
    smokingHabits?: string;
    drinkingHabits?: string;
    religiousPractices?: string;
  };
  about?: {
    aboutMe?: string;
    hobbies?: string[];
    interests?: string[];
    partnerExpectations?: string;
  };
  partnerPreference?: {
    ageMin?: number;
    ageMax?: number;
    countries?: string[];
    cities?: string[];
    religions?: string[];
    communities?: string[];
    educationLevels?: string[];
  };
  verification?: { level?: string };
}

function formatEnum(value?: string): string {
  return value ? value.replace(/_/g, ' ') : 'Not shared';
}

function orBlank(value?: string | number): string {
  if (value === undefined || value === null || value === '') return 'Not shared';
  return String(value);
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

export async function generateBiodataPdf(
  profile: BiodataProfileInput,
  options: { isPaid: boolean },
): Promise<Buffer> {
  const { isPaid } = options;

  // Fetch photo only when a URL is present (already privacy-gated by getVisibleProfile)
  let photoBuffer: Buffer | null = null;
  if (isPaid && profile.photoUrl) {
    photoBuffer = await fetchImageBuffer(profile.photoUrl);
  }

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN, bufferPages: true });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    if (isPaid) {
      renderPremiumBiodata(doc, profile, photoBuffer);
    } else {
      renderFreeBiodata(doc, profile);
    }

    doc.end();
  });
}

// ─── Premium Template ────────────────────────────────────────────────────────

function renderPremiumBiodata(
  doc: PDFKit.PDFDocument,
  profile: BiodataProfileInput,
  photoBuffer: Buffer | null,
): void {
  const fullName =
    [profile.personal?.firstName, profile.personal?.lastName].filter(Boolean).join(' ') ||
    'Vivah Member';

  // ── Header band ────────────────────────────────────────────────────────────
  doc.rect(0, 0, PAGE_WIDTH, 110).fill(MAROON);

  // Gold decorative rule at bottom of header
  doc.rect(0, 108, PAGE_WIDTH, 3).fill(GOLD);

  // Brand name
  doc
    .fillColor(WHITE)
    .font('Helvetica-Bold')
    .fontSize(22)
    .text('VIVAH AUSTRALIA', PAGE_MARGIN, 26, { lineBreak: false });

  // Tagline
  doc
    .fillColor(GOLD)
    .font('Helvetica-Oblique')
    .fontSize(9)
    .text('Connecting Hearts. Creating Futures.', PAGE_MARGIN, 52, { lineBreak: false });

  // Australia text badge (right-aligned)
  doc
    .save()
    .fillOpacity(0.7)
    .fillColor(WHITE)
    .font('Helvetica')
    .fontSize(8)
    .text('Australia\'s Trusted Matrimonial Platform', PAGE_MARGIN, 68, {
      width: CONTENT_WIDTH,
      align: 'right',
      lineBreak: false,
    })
    .restore();

  // Document type label
  doc
    .fillColor(WHITE)
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('MARRIAGE BIODATA', PAGE_MARGIN, 85, { width: CONTENT_WIDTH, align: 'right', lineBreak: false });

  let yPos = 128;

  // ── Photo + Name Hero ──────────────────────────────────────────────────────
  const heroTop = yPos;
  const photoSize = 100;
  const photoX = PAGE_MARGIN;
  const textX = PAGE_MARGIN + photoSize + 18;
  const textWidth = CONTENT_WIDTH - photoSize - 18;

  if (photoBuffer) {
    // Circular clip workaround: draw rounded rect then image
    doc
      .save()
      .roundedRect(photoX, heroTop, photoSize, photoSize, 8)
      .clip()
      .image(photoBuffer, photoX, heroTop, { fit: [photoSize, photoSize], align: 'center', valign: 'center' })
      .restore();

    // Subtle border around photo
    doc
      .roundedRect(photoX, heroTop, photoSize, photoSize, 8)
      .lineWidth(1.5)
      .strokeColor(GOLD)
      .stroke();
  } else {
    // Placeholder box
    doc
      .roundedRect(photoX, heroTop, photoSize, photoSize, 8)
      .fillAndStroke(IVORY, GOLD);
    doc
      .fillColor(GOLD)
      .font('Helvetica-Bold')
      .fontSize(32)
      .text((profile.personal?.firstName ?? 'V').slice(0, 1).toUpperCase(), photoX, heroTop + 30, {
        width: photoSize,
        align: 'center',
        lineBreak: false,
      });
  }

  // Name
  doc
    .fillColor(MAROON)
    .font('Helvetica-Bold')
    .fontSize(20)
    .text(fullName, textX, heroTop, { width: textWidth, lineBreak: false });

  // Summary line
  const summaryParts = [
    profile.personal?.age ? `${profile.personal.age} years` : null,
    profile.location?.city,
    profile.employment?.occupation,
  ].filter(Boolean);

  doc
    .fillColor(CHARCOAL)
    .font('Helvetica')
    .fontSize(10)
    .text(summaryParts.join('  ·  '), textX, heroTop + 26, { width: textWidth });

  // Religion/community tag
  const communityParts = [profile.religion?.religion, profile.religion?.community].filter(Boolean);
  if (communityParts.length) {
    doc
      .fillColor(MID_GREY)
      .font('Helvetica-Oblique')
      .fontSize(9)
      .text(communityParts.join(' · '), textX, heroTop + 42, { width: textWidth });
  }

  // Profile ID + verification badge line
  const badgeY = heroTop + 60;
  doc
    .fillColor(MID_GREY)
    .font('Helvetica')
    .fontSize(8)
    .text(`Profile ID: ${profile.displayId}`, textX, badgeY, { lineBreak: false });

  if (profile.verification?.level && profile.verification.level !== 'NONE') {
    doc
      .fillColor(GOLD)
      .font('Helvetica-Bold')
      .fontSize(8)
      .text(
        `  ✓ ${profile.verification.level.replace(/_/g, ' ')}`,
        textX + 80,
        badgeY,
        { lineBreak: false },
      );
  }

  yPos = Math.max(heroTop + photoSize, doc.y) + 20;

  // Gold divider
  doc.rect(PAGE_MARGIN, yPos, CONTENT_WIDTH, 1).fill(GOLD);
  yPos += 12;

  // ── Sections ───────────────────────────────────────────────────────────────
  yPos = renderSection(doc, yPos, 'Personal Details', MAROON, isPremium, [
    ['Full Name', fullName],
    ['Age', profile.personal?.age ? `${profile.personal.age} years` : undefined],
    ['Gender', formatEnum(profile.personal?.gender)],
    ['Marital Status', formatEnum(profile.personal?.maritalStatus)],
    ['Height', profile.personal?.heightCm ? `${profile.personal.heightCm} cm` : undefined],
  ]);

  yPos = renderSection(doc, yPos, 'Location', MAROON, isPremium, [
    ['City', profile.location?.city],
    ['State', profile.location?.state],
    ['Country', profile.location?.country],
    ['Visa Status', profile.location?.visaStatus],
  ]);

  yPos = renderSection(doc, yPos, 'Religion & Community', MAROON, isPremium, [
    ['Religion', profile.religion?.religion],
    ['Community', profile.religion?.community],
    ['Mother Tongue', profile.religion?.motherTongue],
    ['Languages Spoken', profile.religion?.languagesSpoken?.join(', ')],
  ]);

  yPos = renderSection(doc, yPos, 'Education & Career', MAROON, isPremium, [
    ['Highest Qualification', profile.education?.highestQualification],
    ['Occupation', profile.employment?.occupation],
    ['Industry', profile.employment?.industry],
    ['Employer', profile.employment?.employerName],
  ]);

  yPos = renderSection(doc, yPos, 'Family Background', MAROON, isPremium, [
    ['Family Values', formatEnum(profile.family?.familyValues)],
    ['Family Type', formatEnum(profile.family?.familyType)],
    ['Father\'s Details', profile.family?.fatherDetails],
    ['Mother\'s Details', profile.family?.motherDetails],
    ['Siblings', profile.family?.siblingDetails],
  ]);

  yPos = renderSection(doc, yPos, 'Lifestyle', MAROON, isPremium, [
    ['Diet', formatEnum(profile.lifestyle?.dietaryPreferences)],
    ['Smoking', formatEnum(profile.lifestyle?.smokingHabits)],
    ['Drinking', formatEnum(profile.lifestyle?.drinkingHabits)],
    ['Religious Practices', formatEnum(profile.lifestyle?.religiousPractices)],
  ]);

  if (profile.about?.aboutMe) {
    yPos = renderNarrativeSection(doc, yPos, 'About', profile.about.aboutMe, GOLD);
  }

  const interests = [...(profile.about?.hobbies ?? []), ...(profile.about?.interests ?? [])].filter(Boolean);
  if (interests.length) {
    yPos = renderSection(doc, yPos, 'Interests & Hobbies', MAROON, isPremium, [
      ['Interests', interests.join(', ')],
    ]);
  }

  if (profile.about?.partnerExpectations) {
    yPos = renderNarrativeSection(doc, yPos, 'Partner Expectations', profile.about.partnerExpectations, GOLD);
  }

  const pref = profile.partnerPreference;
  if (pref) {
    const ageRange =
      pref.ageMin || pref.ageMax
        ? `${pref.ageMin ?? '?'} – ${pref.ageMax ?? '?'} years`
        : undefined;

    yPos = renderSection(doc, yPos, 'Partner Preferences', MAROON, isPremium, [
      ['Age Range', ageRange],
      ['Religion', pref.religions?.join(', ')],
      ['Community', pref.communities?.join(', ')],
      ['Location', [...(pref.countries ?? []), ...(pref.cities ?? [])].join(', ')],
      ['Education', pref.educationLevels?.join(', ')],
    ]);
  }

  renderPremiumFooter(doc, profile.displayId);
}

const isPremium = true;

// ─── Free Template ────────────────────────────────────────────────────────────

function renderFreeBiodata(doc: PDFKit.PDFDocument, profile: BiodataProfileInput): void {
  const fullName =
    [profile.personal?.firstName, profile.personal?.lastName].filter(Boolean).join(' ') ||
    'Vivah Member';

  // Simple header — no colour fill, just text
  doc
    .fillColor(CHARCOAL)
    .font('Helvetica-Bold')
    .fontSize(16)
    .text('VIVAH AUSTRALIA', PAGE_MARGIN, PAGE_MARGIN, { align: 'center' });

  doc
    .fillColor(MID_GREY)
    .font('Helvetica')
    .fontSize(8)
    .text('Australia\'s Trusted Matrimonial Platform  |  vivahaustralia.com.au', PAGE_MARGIN, PAGE_MARGIN + 22, {
      align: 'center',
    });

  // Thin grey rule
  const ruleY = PAGE_MARGIN + 40;
  doc.rect(PAGE_MARGIN, ruleY, CONTENT_WIDTH, 0.5).fill(LIGHT_GREY);

  // Name + basic info
  doc
    .fillColor(CHARCOAL)
    .font('Helvetica-Bold')
    .fontSize(15)
    .text(fullName, PAGE_MARGIN, ruleY + 14, { align: 'center' });

  const summaryParts = [
    profile.personal?.age ? `${profile.personal.age} years` : null,
    profile.location?.city,
    profile.employment?.occupation,
  ].filter(Boolean);

  if (summaryParts.length) {
    doc
      .fillColor(MID_GREY)
      .font('Helvetica')
      .fontSize(9)
      .text(summaryParts.join('  ·  '), PAGE_MARGIN, ruleY + 34, { align: 'center' });
  }

  doc
    .fillColor(MID_GREY)
    .font('Helvetica')
    .fontSize(8)
    .text(`Profile ID: ${profile.displayId}`, PAGE_MARGIN, ruleY + 50, { align: 'center' });

  doc.rect(PAGE_MARGIN, ruleY + 66, CONTENT_WIDTH, 0.5).fill(LIGHT_GREY);

  let yPos = ruleY + 78;

  // ── Sections (monochrome) ──────────────────────────────────────────────────
  yPos = renderSection(doc, yPos, 'Personal Details', CHARCOAL, false, [
    ['Full Name', fullName],
    ['Age', profile.personal?.age ? `${profile.personal.age} years` : undefined],
    ['Gender', formatEnum(profile.personal?.gender)],
    ['Marital Status', formatEnum(profile.personal?.maritalStatus)],
    ['Height', profile.personal?.heightCm ? `${profile.personal.heightCm} cm` : undefined],
  ]);

  yPos = renderSection(doc, yPos, 'Location', CHARCOAL, false, [
    ['City', profile.location?.city],
    ['State', profile.location?.state],
    ['Country', profile.location?.country],
    ['Visa Status', profile.location?.visaStatus],
  ]);

  yPos = renderSection(doc, yPos, 'Religion & Community', CHARCOAL, false, [
    ['Religion', profile.religion?.religion],
    ['Community', profile.religion?.community],
    ['Mother Tongue', profile.religion?.motherTongue],
    ['Languages Spoken', profile.religion?.languagesSpoken?.join(', ')],
  ]);

  yPos = renderSection(doc, yPos, 'Education & Career', CHARCOAL, false, [
    ['Highest Qualification', profile.education?.highestQualification],
    ['Occupation', profile.employment?.occupation],
    ['Industry', profile.employment?.industry],
  ]);

  yPos = renderSection(doc, yPos, 'Family Background', CHARCOAL, false, [
    ['Family Values', formatEnum(profile.family?.familyValues)],
    ['Family Type', formatEnum(profile.family?.familyType)],
    ['Father\'s Details', profile.family?.fatherDetails],
    ['Mother\'s Details', profile.family?.motherDetails],
    ['Siblings', profile.family?.siblingDetails],
  ]);

  yPos = renderSection(doc, yPos, 'Lifestyle', CHARCOAL, false, [
    ['Diet', formatEnum(profile.lifestyle?.dietaryPreferences)],
    ['Smoking', formatEnum(profile.lifestyle?.smokingHabits)],
    ['Drinking', formatEnum(profile.lifestyle?.drinkingHabits)],
  ]);

  if (profile.about?.aboutMe) {
    yPos = renderNarrativeSection(doc, yPos, 'About', profile.about.aboutMe, MID_GREY);
  }

  if (profile.about?.partnerExpectations) {
    yPos = renderNarrativeSection(doc, yPos, 'Partner Expectations', profile.about.partnerExpectations, MID_GREY);
  }

  const pref = profile.partnerPreference;
  if (pref) {
    const ageRange =
      pref.ageMin || pref.ageMax
        ? `${pref.ageMin ?? '?'} – ${pref.ageMax ?? '?'} years`
        : undefined;

    yPos = renderSection(doc, yPos, 'Partner Preferences', CHARCOAL, false, [
      ['Age Range', ageRange],
      ['Religion', pref.religions?.join(', ')],
      ['Community', pref.communities?.join(', ')],
      ['Location', [...(pref.countries ?? []), ...(pref.cities ?? [])].join(', ')],
      ['Education', pref.educationLevels?.join(', ')],
    ]);
  }

  renderFreeFooter(doc, profile.displayId);

  void yPos; // suppress unused warning — yPos tracks layout but footer is at page bottom
}

// ─── Shared Layout Helpers ────────────────────────────────────────────────────

function ensureSpace(doc: PDFKit.PDFDocument, needed: number): void {
  const pageHeight = 841.89;
  const bottomMargin = 80;
  if (doc.y + needed > pageHeight - bottomMargin) {
    doc.addPage();
  }
}

function renderSection(
  doc: PDFKit.PDFDocument,
  yStart: number,
  title: string,
  accentColor: [number, number, number],
  premium: boolean,
  fields: Array<[string, string | undefined]>,
): number {
  const filteredFields = fields.filter(([, v]) => v && v !== 'Not shared');
  if (filteredFields.length === 0) return yStart;

  ensureSpace(doc, 40 + filteredFields.length * 16);

  doc.y = yStart;

  // Section header
  if (premium) {
    doc.save().fillOpacity(0.08).rect(PAGE_MARGIN, doc.y, CONTENT_WIDTH, 20).fill(accentColor).restore();
    doc
      .fillColor(accentColor)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(title.toUpperCase(), PAGE_MARGIN + 6, doc.y + 6, { lineBreak: false });
    doc.moveDown(0.1);
    doc.y += 20;
  } else {
    doc
      .fillColor(accentColor)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(title.toUpperCase(), PAGE_MARGIN, doc.y, { lineBreak: false });
    doc.rect(PAGE_MARGIN, doc.y + 12, CONTENT_WIDTH, 0.5).fill(LIGHT_GREY);
    doc.y += 16;
  }

  // Two-column field grid
  const colWidth = CONTENT_WIDTH / 2 - 6;
  let col = 0;
  let rowY = doc.y + 4;

  for (const [label, value] of filteredFields) {
    const x = col === 0 ? PAGE_MARGIN : PAGE_MARGIN + colWidth + 12;

    doc
      .fillColor(GOLD)
      .font('Helvetica-Bold')
      .fontSize(7)
      .text(label.toUpperCase(), x, rowY, { lineBreak: false, width: colWidth });

    doc
      .fillColor(CHARCOAL)
      .font('Helvetica')
      .fontSize(9)
      .text(orBlank(value), x, rowY + 9, { lineBreak: false, width: colWidth });

    if (col === 1) {
      rowY += 24;
      col = 0;
    } else {
      col = 1;
    }
  }

  // Flush to the lower of the two columns
  const finalY = col === 0 ? rowY : rowY + 24;
  doc.y = finalY + 10;

  return doc.y;
}

function renderNarrativeSection(
  doc: PDFKit.PDFDocument,
  yStart: number,
  title: string,
  text: string,
  accentColor: [number, number, number],
): number {
  ensureSpace(doc, 60);

  doc.y = yStart;

  doc
    .fillColor(accentColor)
    .font('Helvetica-Bold')
    .fontSize(9)
    .text(title.toUpperCase(), PAGE_MARGIN, doc.y);

  doc.rect(PAGE_MARGIN, doc.y + 2, CONTENT_WIDTH, 0.5).fill(LIGHT_GREY);

  doc
    .fillColor(CHARCOAL)
    .font('Helvetica-Oblique')
    .fontSize(9)
    .text(`"${text}"`, PAGE_MARGIN, doc.y + 10, { width: CONTENT_WIDTH, lineGap: 3 });

  doc.y += 12;
  return doc.y;
}

function renderPremiumFooter(doc: PDFKit.PDFDocument, displayId: string): void {
  const totalPages = (doc.bufferedPageRange().count);
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    const footerY = 841.89 - 38;

    doc.rect(0, footerY - 4, PAGE_WIDTH, 1).fill(GOLD);
    doc.rect(0, footerY - 3, PAGE_WIDTH, 32).fill(MAROON);

    doc
      .fillColor(WHITE)
      .font('Helvetica-Bold')
      .fontSize(7)
      .text('VIVAH AUSTRALIA', PAGE_MARGIN, footerY + 4, { lineBreak: false });

    doc
      .fillColor(GOLD)
      .font('Helvetica')
      .fontSize(7)
      .text('vivahaustralia.com.au', PAGE_MARGIN + 85, footerY + 4, { lineBreak: false });

    doc
      .save()
      .fillOpacity(0.6)
      .fillColor(WHITE)
      .font('Helvetica')
      .fontSize(7)
      .text(
        `Profile ${displayId}  ·  Page ${i + 1} of ${totalPages}  ·  Confidential`,
        PAGE_MARGIN,
        footerY + 16,
        { width: CONTENT_WIDTH, align: 'right', lineBreak: false },
      )
      .restore();
  }
}

function renderFreeFooter(doc: PDFKit.PDFDocument, displayId: string): void {
  const totalPages = doc.bufferedPageRange().count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    const footerY = 841.89 - 32;

    doc.rect(PAGE_MARGIN, footerY, CONTENT_WIDTH, 0.5).fill(LIGHT_GREY);

    doc
      .fillColor(MID_GREY)
      .font('Helvetica')
      .fontSize(7)
      .text(
        `Vivah Australia  ·  vivahaustralia.com.au  ·  Profile ${displayId}  ·  Page ${i + 1} of ${totalPages}`,
        PAGE_MARGIN,
        footerY + 6,
        { width: CONTENT_WIDTH, align: 'center', lineBreak: false },
      );
  }
}
