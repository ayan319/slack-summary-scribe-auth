/** @type {import('next-sitemap').IConfig} */
export default {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://summaryai.com',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  changefreq: 'daily',
  priority: 0.7,
  exclude: [
    '/admin',
    '/admin/*',
    '/api/*',
    '/settings',
    '/slack-test',
    '/dev/*',
    '/test/*'
  ],
  additionalPaths: async (config) => [
    await config.transform(config, '/'),
    await config.transform(config, '/pricing'),
    await config.transform(config, '/for-founders'),
    await config.transform(config, '/for-sales'),
    await config.transform(config, '/for-education'),
    await config.transform(config, '/changelog'),
    await config.transform(config, '/beta'),
    await config.transform(config, '/privacy'),
    await config.transform(config, '/terms'),
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/settings', '/slack-test']
      }
    ],
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://summaryai.com'}/sitemap.xml`,
    ]
  }
}
