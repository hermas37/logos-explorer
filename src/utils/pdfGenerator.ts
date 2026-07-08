import { Episode, StudyProfile, BookReview, ExecutiveSummaryData, Quotation, SpecializedReportData, EpisodeSource } from '../types';

/**
 * Clean HTML/CSS template to render a highly polished printable PDF / study guide.
 */
export function generatePrintableHTML(
  episode: Episode,
  profile: StudyProfile,
  scope: 'executive_summary' | 'book_review' | 'all'
): string {
  const profileNames: Record<StudyProfile, string> = {
    academic_en: 'Academic (EN)',
    esl_en: 'Simplified (EN)',
    translated_es: 'Español (ES)',
    translated_id: 'Indonesian',
  };

  const title = episode.title[profile] || episode.title['academic_en'];
  const description = episode.description[profile] || episode.description['academic_en'];

  // 1. STYLE SHEET DESIGN
  const style = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap');
    
    @page {
      size: A4 portrait;
      margin: 20mm 15mm 20mm 15mm;
    }
    
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      color: #1e293b;
      line-height: 1.6;
      font-size: 11pt;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    h1, h2, h3, h4, h5, .serif-text {
      font-family: 'Playfair Display', Georgia, serif;
      color: #0f172a;
    }

    .mono-text {
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 8.5pt;
    }

    /* Layout Utilities */
    .header-bar {
      border-bottom: 2px solid #020617;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }

    .badge {
      display: inline-block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      background-color: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
      padding: 3px 8px;
      border-radius: 4px;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 24px;
      font-size: 9.5pt;
    }

    .meta-item {
      border-bottom: 1px dashed #e2e8f0;
      padding-bottom: 6px;
    }

    .meta-label {
      font-weight: 600;
      color: #64748b;
    }

    .meta-value {
      float: right;
      font-weight: 500;
      color: #0f172a;
    }

    /* Executive Callouts */
    .callout-box {
      background-color: #f8fafc;
      border-left: 4px solid #4f46e5;
      padding: 16px;
      border-radius: 0 8px 8px 0;
      margin: 20px 0;
    }

    .callout-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.5pt;
      text-transform: uppercase;
      color: #4338ca;
      font-weight: 700;
      margin-top: 0;
      margin-bottom: 6px;
      letter-spacing: 0.05em;
    }

    .callout-body {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 11pt;
      font-style: italic;
      line-height: 1.5;
      color: #1e1b4b;
      margin: 0;
    }

    /* Content Cards */
    .item-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      background-color: #ffffff;
      page-break-inside: avoid;
    }

    .item-num {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      font-weight: 700;
      color: #6366f1;
      margin-bottom: 4px;
      display: block;
    }

    .item-title {
      font-size: 12pt;
      font-weight: 700;
      margin-top: 0;
      margin-bottom: 8px;
    }

    /* Book Review specific styles */
    .book-meta {
      display: flex;
      gap: 20px;
      align-items: center;
      margin-bottom: 20px;
      background-color: #f8fafc;
      padding: 14px;
      border-radius: 8px;
      border: 1px solid #f1f5f9;
    }

    .book-rating {
      color: #eab308;
      font-size: 14pt;
      letter-spacing: 2px;
    }

    .chapter-row {
      display: flex;
      border-bottom: 1px solid #f1f5f9;
      padding: 10px 0;
      page-break-inside: avoid;
    }

    .chapter-name {
      font-weight: 600;
      width: 30%;
      color: #4f46e5;
    }

    .chapter-desc {
      width: 70%;
      font-size: 10pt;
      color: #475569;
    }

    /* Page Breaks and Spacing */
    .page-break {
      page-break-after: always;
    }

    .section-title {
      font-size: 16pt;
      font-weight: 700;
      border-bottom: 1px solid #0f172a;
      padding-bottom: 6px;
      margin-top: 32px;
      margin-bottom: 18px;
      page-break-after: avoid;
    }

    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      text-align: center;
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.5pt;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
    }
  `;

  // 2. HELPER TO RENDER EXECUTIVE SUMMARY
  const renderExecutiveSummary = () => {
    if (!episode.study_modules.executive_summary) return '';
    const points = episode.study_modules.executive_summary[profile] || episode.study_modules.executive_summary['academic_en'];

    // Hero Statement selection
    const thesisText: Record<StudyProfile, string> = {
      academic_en: 'The mathematical fine-tuning of cosmic parameters and low-entropy initial states presents a rigorous empirical challenge to materialism, pointing rationally toward a primary teleological source—the Logos.',
      esl_en: 'The perfect rules and clean setup of our universe are not lucky accidents. They show a highly smart and powerful Creator designed our home with a plan.',
      translated_es: 'El ajuste fino matemático de los parámetros cósmicos y los estados iniciales de baja entropía presenta un desafío empírico riguroso al materialismo, apuntando racionalmente hacia una fuente teleológica primaria: el Logos.',
      translated_id: 'Penyelarasan halus matematis dari parameter kosmis dan tingkat entropi awal yang rendah menyajikan tantangan empiris yang kuat terhadap materialisme, menunjuk secara rasional kepada sumber teleologis utama—yaitu Logos.',
    };

    return `
      <div>
        <h2 class="section-title">Executive Synthesis & Critical Arguments</h2>
        
        <div class="callout-box">
          <p class="callout-title">${profile === 'esl_en' ? 'Core Thesis' : 'Central Logical Premise'}</p>
          <p class="callout-body">"${thesisText[profile] || thesisText['academic_en']}"</p>
        </div>

        <div style="margin-top: 24px;">
          ${points.map((point, idx) => `
            <div class="item-card">
              <span class="item-num">
                ${profile === 'academic_en' ? `CORE ARGUMENT 0${idx + 1}` : ''}
                ${profile === 'esl_en' ? `POINT ${idx + 1}` : ''}
                ${profile === 'translated_es' ? `ARGUMENTO PRINCIPAL 0${idx + 1}` : ''}
                ${profile === 'translated_id' ? `ARGUMEN UTAMA 0${idx + 1}` : ''}
              </span>
              <p style="margin: 0; font-size: 10.5pt; color: #334155;">${point}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  // 3. HELPER TO RENDER BOOK REVIEW
  const renderBookReview = () => {
    if (!episode.study_modules.book_review) return '';
    const review: BookReview = episode.study_modules.book_review[profile] || episode.study_modules.book_review['academic_en'];

    const ratingStars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

    return `
      <div>
        <h2 class="section-title">Theological-Scientific Literature Review</h2>
        
        <div class="book-meta">
          <div style="flex-grow: 1;">
            <h3 style="margin: 0; font-size: 14pt; font-weight: 700;">${review.title}</h3>
            <p style="margin: 4px 0 0 0; font-size: 10pt; color: #475569;">
              By <strong>${review.author}</strong> &bull; Published: ${review.publish_year}
            </p>
          </div>
          <div style="text-align: right;">
            <div class="book-rating">${ratingStars}</div>
            <span class="badge">Study Choice Recommendation</span>
          </div>
        </div>

        <h4 style="margin: 18px 0 8px 0; font-size: 11pt; text-transform: uppercase; font-family: 'JetBrains Mono', monospace; color: #4f46e5;">Executive Overview</h4>
        <p style="margin-bottom: 24px; text-align: justify; font-size: 10.5pt;">${review.overview}</p>

        <h4 style="margin: 24px 0 12px 0; font-size: 11pt; text-transform: uppercase; font-family: 'JetBrains Mono', monospace; color: #4f46e5;">Key Lessons & Takeaways</h4>
        <div style="margin-bottom: 24px;">
          ${review.key_takeaways.map((takeaway, idx) => `
            <div style="display: flex; gap: 12px; margin-bottom: 10px; align-items: start; page-break-inside: avoid;">
              <span style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #4338ca; background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 4px; padding: 1px 6px; font-size: 9pt;">${idx + 1}</span>
              <p style="margin: 0; font-size: 10pt; color: #334155;">${takeaway}</p>
            </div>
          `).join('')}
        </div>

        <h4 style="margin: 24px 0 8px 0; font-size: 11pt; text-transform: uppercase; font-family: 'JetBrains Mono', monospace; color: #4f46e5;">Cosmic Integration Reflection</h4>
        <div style="border-left: 2px solid #cbd5e1; padding-left: 14px; font-style: italic; font-family: 'Playfair Display', Georgia, serif; font-size: 11pt; color: #334155; margin-bottom: 24px; page-break-inside: avoid;">
          "${review.scientific_theological_alignment}"
        </div>

        <h4 style="margin: 24px 0 12px 0; font-size: 11pt; text-transform: uppercase; font-family: 'JetBrains Mono', monospace; color: #4f46e5;">Essential Chapter Guidance</h4>
        <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 0 14px; background-color: #ffffff;">
          ${review.recommended_chapters.map((chap) => `
            <div class="chapter-row">
              <span class="chapter-name">${chap.chapter}</span>
              <span class="chapter-desc">${chap.description}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  // 4. HELPER TO RENDER OTHER SECTIONS (Slide, Quotes, Report, Sources) FOR COMPREHENSIVE GUIDE
  const renderAdditionalSections = () => {
    let html = '';

    // Specialized Report
    if (episode.study_modules.specialized_reports) {
      const report: SpecializedReportData = episode.study_modules.specialized_reports[profile] || episode.study_modules.specialized_reports['academic_en'];
      html += `
        <div class="page-break"></div>
        <div>
          <h2 class="section-title">Specialized Scholarly Report: ${report.title}</h2>
          <div style="font-size: 10.5pt; color: #334155; line-height: 1.7; text-align: justify; white-space: pre-line;">
            ${report.body}
          </div>
        </div>
      `;
    }

    // Inspiring Quotations
    if (episode.inspiring_quotations && episode.inspiring_quotations.length > 0) {
      html += `
        <div class="page-break"></div>
        <div>
          <h2 class="section-title">Inspiring Academic & Theological Citations</h2>
          <div style="margin-top: 18px;">
            ${episode.inspiring_quotations.map((quote) => {
              const quoteText = quote.quote_text[profile] || quote.quote_text['academic_en'];
              return `
                <div class="item-card" style="border-left: 3px solid #6366f1;">
                  <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 11.5pt; font-style: italic; color: #1e293b; margin: 0 0 10px 0;">
                    "${quoteText}"
                  </p>
                  <p style="margin: 0; font-size: 9pt; font-family: 'JetBrains Mono', monospace; color: #64748b; text-align: right;">
                    &mdash; ${quote.author} (${quote.historical_role})
                  </p>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    // Sources Referenced
    if (episode.sources && episode.sources.length > 0) {
      html += `
        <div style="margin-top: 32px; page-break-inside: avoid;">
          <h2 class="section-title">Reference Literature & Sources Cited</h2>
          <div style="display: grid; grid-template-columns: 1fr; gap: 12px; margin-top: 12px;">
            ${episode.sources.map((source) => `
              <div style="border: 1px solid #f1f5f9; background-color: #f8fafc; padding: 12px; border-radius: 6px;">
                <span class="badge" style="font-size: 7pt; margin-bottom: 6px;">Literature</span>
                <h4 style="margin: 4px 0 2px 0; font-size: 10.5pt; font-weight: 700; color: #0f172a;">${source.title}</h4>
                <p style="margin: 0; font-size: 9pt; color: #64748b;">${source.author || 'Primary Source'}</p>
                ${source.citation ? `<p style="margin: 6px 0 0 0; font-size: 8.5pt; font-style: italic; color: #475569; border-top: 1px dashed #e2e8f0; padding-top: 4px;">${source.citation}</p>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Inspiring Narrative / Story (if any)
    if (episode.study_modules.inspiring_story) {
      const storyText = episode.study_modules.inspiring_story[profile] || episode.study_modules.inspiring_story['academic_en'];
      html += `
        <div class="page-break"></div>
        <div>
          <h2 class="section-title">Inspiring Narrative</h2>
          <div style="border-left: 2px solid #eab308; padding-left: 16px; font-family: 'Playfair Display', Georgia, serif; font-size: 11pt; font-style: italic; color: #451a03; line-height: 1.7; white-space: pre-line;">
            ${storyText}
          </div>
        </div>
      `;
    }

    return html;
  };

  // 5. ASSEMBLE FULL HTML LAYOUT
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Logos Study Companion - ${title}</title>
      <style>${style}</style>
    </head>
    <body>
      <!-- Page Header -->
      <div class="header-bar">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <span class="badge">Episode Study Guide #${episode.id}</span>
            <h1 style="margin: 6px 0 2px 0; font-size: 20pt; font-weight: 700;">${title}</h1>
            <p style="margin: 0; font-size: 10pt; color: #475569; max-width: 85%;">
              ${description}
            </p>
          </div>
          <div style="text-align: right;" class="mono-text">
            <span style="font-weight: 700; color: #4f46e5;">LOGOS-EXPLORER</span><br>
            <span style="color: #64748b; font-size: 7.5pt;">Study Companion v1.0</span>
          </div>
        </div>
      </div>

      <!-- Metadata Box -->
      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Selected Language</span>
          <span class="meta-value">${profileNames[profile]}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Date Generated</span>
          <span class="meta-value">${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      <!-- Dynamic Scope Router -->
      ${scope === 'executive_summary' ? renderExecutiveSummary() : ''}
      ${scope === 'book_review' ? renderBookReview() : ''}
      ${scope === 'all' ? `
        ${renderExecutiveSummary()}
        <div class="page-break"></div>
        ${renderBookReview()}
        ${renderAdditionalSections()}
      ` : ''}

      <!-- Footer Watermark -->
      <div class="footer">
        Generated via Logos-Explorer Study Hub (hermas37/logos-explorer) &bull; Dedicated to Scientific and Faith Harmony.
      </div>

      <!-- Trigger Print dialog natively -->
      <script>
        window.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => {
            window.print();
          }, 600);
        });
      </script>
    </body>
    </html>
  `;
}

/**
 * Triggers browser-native printing of custom PDF study guides
 * using a highly secure, non-blocking hidden iframe mechanism.
 */
export function printEpisodePDF(
  episode: Episode,
  profile: StudyProfile,
  scope: 'executive_summary' | 'book_review' | 'all'
): void {
  // 1. Remove any previous printer iframe to keep DOM pristine
  const existingIframe = document.getElementById('logos-pdf-printer-iframe');
  if (existingIframe) {
    existingIframe.parentNode?.removeChild(existingIframe);
  }

  // 2. Generate custom-styled HTML content
  const htmlContent = generatePrintableHTML(episode, profile, scope);

  // 3. Create a clean hidden iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'logos-pdf-printer-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';

  // 4. Inject iframe into body
  document.body.appendChild(iframe);

  // 5. Write content into iframe document to boot CSS styles and print script
  const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();
  }
}
