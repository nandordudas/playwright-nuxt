import chromium from '@sparticuz/chromium'
import { consola } from 'consola'
import { chromium as playwright } from 'playwright-core'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    if (!body.html)
      throw new Error('No HTML content provided')

    const executablePath = await chromium.executablePath()

    consola.log('Launching browser...')

    const browser = await playwright.launch({
      args: chromium.args,
      executablePath,
      // @ts-expect-error Type 'true | "shell"' is not assignable to type 'boolean | undefined'.
      headless: chromium.headless,
    })
    const context = await browser.newContext()

    consola.log('Creating page...')

    const page = await context.newPage()

    // Double try-catch, yeah I know 🤪
    try {
      consola.log('Setting content...')

      await page.setContent(body.html, {
        waitUntil: 'networkidle',
        timeout: 30_000, // Add timeout
      })

      consola.log('Generating PDF...') // Debug log

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '2cm',
          bottom: '2cm',
          left: '2.5cm',
          right: '2.5cm',
        },
      })

      setHeader(event, 'Content-Type', 'application/pdf')
      setHeader(event, 'Content-Disposition', `attachment; filename=${crypto.randomUUID()}.pdf`)

      return pdf
    }
    finally {
      await context.close()
      await browser.close()
    }
  }
  catch (error) {
    consola.error('Error in PDF generation:', error)

    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'PDF generation failed',
    })
  }
})
