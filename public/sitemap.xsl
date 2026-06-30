<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <xsl:output method="html" encoding="UTF-8" indent="yes" />

  <xsl:template match="/">
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <title>شبام 24 — Sitemap Viewer</title>
        <style>
          body{font-family:Tahoma,Arial,sans-serif;background:#f8fafc;color:#0f172a;margin:0;padding:32px;direction:rtl}
          .wrap{max-width:1200px;margin:0 auto}
          h1{margin:0 0 8px;color:#991b1b}
          p{margin:0 0 20px;color:#475569}
          table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,42,.06)}
          th,td{padding:12px 14px;border-bottom:1px solid #e2e8f0;text-align:right;vertical-align:top;font-size:14px}
          th{background:#fff5f5;color:#991b1b;font-weight:700}
          tr:last-child td{border-bottom:none}
          a{color:#b91c1c;text-decoration:none;word-break:break-all}
          a:hover{text-decoration:underline}
          .badge{display:inline-block;background:#fee2e2;color:#991b1b;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:700;margin-bottom:14px}
          .ltr{direction:ltr;text-align:left}
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="badge">XML Sitemap</div>
          <h1>شبام 24</h1>
          <p>هذه صفحة عرض للـ sitemap لتسهيل الفحص البشري، بينما يبقى الملف نفسه XML صالحًا للفهرسة لمحركات البحث.</p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>الرابط</th>
                <th>آخر تحديث</th>
                <th>الأولوية / التكرار</th>
                <th>بيانات الأخبار</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="s:urlset/s:url">
                <tr>
                  <td><xsl:value-of select="position()" /></td>
                  <td class="ltr"><a href="{s:loc}"><xsl:value-of select="s:loc" /></a></td>
                  <td class="ltr"><xsl:value-of select="s:lastmod" /></td>
                  <td>
                    <xsl:value-of select="s:priority" />
                    <xsl:if test="s:changefreq">
                      <xsl:text> / </xsl:text>
                      <xsl:value-of select="s:changefreq" />
                    </xsl:if>
                  </td>
                  <td>
                    <xsl:if test="news:news">
                      <div><strong><xsl:value-of select="news:news/news:publication/news:name" /></strong></div>
                      <div class="ltr"><xsl:value-of select="news:news/news:publication_date" /></div>
                      <div><xsl:value-of select="news:news/news:title" /></div>
                    </xsl:if>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
