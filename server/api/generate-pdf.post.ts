import chromium from '@sparticuz/chromium'
import { consola } from 'consola'
import { chromium as playwright } from 'playwright-core'

interface GeneratePdfBody {
  html?: string | undefined
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<GeneratePdfBody>(event)

    // [INFO] No `valibot` for simplicity.
    if (!body.html) {
      throw createError({
        statusCode: 400,
        message: 'Missing "html" in request body',
      })
    }

    setHeaders(event, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${crypto.randomUUID()}.pdf`,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    })

    const pdf = await generatePDF(body.html)

    return pdf
  }
  catch (error) {
    consola.error('Error in PDF generation:', error)

    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'PDF generation failed',
    })
  }
})

async function generatePDF(html: string) {
  const executablePath = await chromium.executablePath()

  consola.debug('Launching browser...')

  const browser = await playwright.launch({
    args: chromium.args,
    executablePath,
    headless: true,
  })

  const context = await browser.newContext({
    javaScriptEnabled: false,
  })

  try {
    consola.debug('Creating page...')

    const page = await context.newPage()

    consola.debug('Setting content...')

    await page.setContent(html, {
      waitUntil: 'networkidle',
      timeout: 3_000,
    })

    await page.emulateMedia({ media: 'print' })

    consola.debug('Generating PDF...')

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      /* margin: {
        top: '2cm',
        bottom: '2cm',
        right: '2.5cm',
        left: '2.5cm',
      }, */
      preferCSSPageSize: true,
    })

    return pdf
  }
  finally {
    await context.close()
    await browser.close()
  }
}
