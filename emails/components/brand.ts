// Tokens de marca compartidos por todos los correos transaccionales.
// Mismos valores que ya usan los 7 correos de PORTAL DE CLIENTES/email-templates/*.html
// — no se usan los tokens genéricos que propuso Stitch (Manier Bold, paleta Material)
// porque no forman parte del sistema de marca real de Suplevet.
export const brand = {
  colors: {
    navy: "#1E3A5F",
    navyDark: "#142840",
    orange: "#F08C4B",
    orangeDark: "#E06830",
    sky: "#99D3DA",
    // Variante oscura del celeste de marca (secondary-fixed-variant del design
    // system) — se usa como fondo sólido de recuadros donde el celeste claro
    // no da suficiente contraste para texto blanco.
    skyDeep: "#2C7A82",
    softGray: "#F8F7F5",
    border: "#F0EFED",
    textMuted: "#6B7280",
    textFaint: "#9CA3AF",
    error: "#C62828",
    errorLight: "#EF5350",
    success: "#2e7d32",
    successLight: "#4caf50",
    warnStart: "#f5d76e",
  },
  // Bebas Neue = titulares (siempre mayúsculas). DM Sans = todo lo demás.
  fonts: {
    headline: "'Bebas Neue',Impact,'Arial Narrow',Arial,sans-serif",
    body: "'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif",
    mono: "'Courier New',monospace",
  },
  googleFontsHref:
    "https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&family=Bebas+Neue&display=swap",
  // Alojado en R2 (no en suplevet.pe/logos/...): ese dominio hoy sirve la
  // tienda Shopify vieja, no esta app, así que la ruta daba 404 en los
  // correos. R2 funciona sin depender de cuándo se lance el dominio nuevo.
  logoUrl: "https://pub-ad8cb8681bd8458ba537a43f6735a89d.r2.dev/branding/logo-white-mixed-horizontal.png",
  siteUrl: "https://suplevet.pe",
  portalUrl: "https://suplevet.pe/mi-cuenta",
  supportEmail: "soporte@suplevet.com",
  // Mismas URLs que usa el footer del sitio (components/layout/Footer.tsx,
  // fallback de lib/site-config.ts) — un solo lugar si cambian. `icon` es un
  // PNG blanco 40x40 embebido como data URI (generado desde los SVG oficiales
  // de cada red, sin depender de hosting externo) para que se vea igual en
  // cualquier cliente de correo sin pedir permiso para cargar imágenes remotas.
  social: {
    facebook: { url: "https://www.facebook.com/suplevetperu/", label: "Facebook", icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAADsOAAA7DgHMtqGDAAACX0lEQVR4nM2Yz0sVURTHJ5J+i/QDoqBokUSLB0FFEYgLoUXrNtE/UFASCVGSEtGijYIRBRH0MFByFfZjVYs2BWEgRGC9iCYEIaMiBMuyT5y8xmOaH/fOmZk3X7g8eNzzPR8uM2fOPZ6XUsBm4CjQDzwExoC3Zo2Z//rMnk1p87hCrQGOA89w11PgGLA6D7AVQDfwCb2mgbPA8qzg2oEa2esN0KYBWwKcB36Rn34C5ySXK9xS4AbFqQo0uZzcTYrXoNVJAhdpnHqT4A4C88okk0APsB/YCKwyvzuAA8DJmFjJ3RFX4z4o4QaSygewNcHjfWitBC4r4foSnx87QNGlYNAGYEYBV7N9Cy0BvwHr6oOk3ml0wgbOAVDUXV9WpKpr1JrwJboOjJh139Lz9aLBLiXcjxi4Q8BvhXdFTE4rAadiAB8rvU+JyR2liR8D+E7pPSwm4zkC+krvF57pz8oK+FFMvpcYcFZM5hwCpBztDqxKDGAlZL/LF2tOTL44BIx7SrFwkbLVZwmYKBjwgUO+V55DZc8KsOaQb1QCLhQFCCwz9xBb9UpQh0PAS2BtYLXEALUE9u7DTe1i0iT1hvKVmel/LRxwtYSAV+qNdiruIn4OgPP/tXDAUIkAq2Fm21K2/X7GgF+BLVGGnSUAPBLlt9j+jzQQ8FYkXJ1pM/C8AYBP5G6eCGiM15spaVGAj5wHm2bScK8AwLvASie4wDN5RhrHHABngS7n2WBEotaY0/RTAI4C29VgIQn3ArcDJ+pbAkqMzAD3ZA4Wklje9MPAtb89W/Q+OSmZKsje5jTJ/gDbQYCa846PSAAAAABJRU5ErkJggg==" },
    whatsapp: { url: "https://wa.me/51920723721", label: "WhatsApp", icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAADsOAAA7DgHMtqGDAAAD3ElEQVR4nL2Ze6jPdxjHfxzCyn1NKJdIpNlc1pSI3CKaOyusNSZhGSkkJBKShE4JITubTS6bW8pJkrIm22q55AjTEnPP9XBeeurz1ePx+Xx/3+/v9z3efz6/53k+7+/nPM/nuZxcrkAAXYG5wG7gT+AO8AyoBO4C54H9wGKgN1BS6FlpSDUBFgKXSI+bwDqgbXUQ+wBYDjyieFQCW4FmWZHrC1wNHPYUOAGsB2YCXwOTgOnAKuAgcD9ge090iyW3AHjpcX4MGAfUS+CjBBgI/OBuz2ILUDstsRrARo+z08BnRXxwG+Bnj98jEkZpHEkwazwHvhfihZLTAEa4rNc4lOgmXSzZWOmTyxhAe6DCnFWaz6ibe8siPAC6Z00uAtACuGJIjsvFBPNZpfgKGJyrZgAd3EVEuAU09il+a75kRcBhF2As8GmGJL80Z6+3CrXMVV8E6ngcfeduFhcKrTIkKZkc4clbDzkwOl8cAD0879jKDAl+DFQp34v1jwfUDxW+wg6UGXJRvNTJkKQ8NREuRcK6rmRFWBowttkWYWKGBKU6aXQSYT8j7BYwfhggeChDgvVNGE3PuQoRQdK9ZsD4rwDB2VkRdOf8rnxvFkGpEpyJMdzkIbc39EFFENyu/JeLYI8S7Ikx7GKyTJB5lQGWKf//iOCoEmzPYyyNpsbhaiA4T/m/Zp+YH/MYN3Wtu8asjAnKSBGhQgQ7lOBoAgeDTBP7AvgiQ4JrlO9zVnAhoZPZnn7xm4DuEBfniRoPYJ/ye0AEE5VAkqBRQke+jnuXrqFAR9Op/OHKajDzzfyzWgSdzCHDUowFpR6SMvmtdXOINB0+/O1r8V0TqzEiOuiaEpYlIWgGqyrSo2meBKl80xeaOHwsA3pKkgOA6ynIXfH4kJbvsvcJAz4xt7AmDUEB0EAajZiaHaHK12AAk43eWKvwq/pRupvWuQIANASmACc9f/rLvhh3TcINpXfxnZYP6GWczSiEoAbwEdAfGAV8HlogAdvM2RN8SsONUufcewAwzZx7PKS4QSn9+57IjTdV6U4wtMybta2aidUA5qgBDEd0aNzOJBgD8vLLmJnFbg9obsoZLpmmxBlNVcryVR+6V32aW/bcVqOmlLiWBWb3IlP6ombjq3zGvyiDZzH7QN0c/ObqePA5kkoAjAR2Bpaf/8lMlI9cidspF4P/XSNwzA3gp8y75kNZoi0r0DPGyUs3xKwExgA/BRaaaVCealvmtvAa512cjfQtcYB2wJKYKQ8PJGRk59g1MTF1oPwbQbpqqYWpgt9l5FBgvmuxpCJIvMkEKAkhg3i71KQUXgO08luti0pJ1wAAAABJRU5ErkJggg==" },
    instagram: { url: "https://www.instagram.com/suplevet.pe/", label: "Instagram", icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAADsOAAA7DgHMtqGDAAADhklEQVR4nM2ZW0tVURDHt5eglyytx0x7z0h7SKXv4a1I6xNk9g3Kyp56DNPEKClIMK0eoiKlLF8jraQLBUUesEwSKjy/GFubhjn7qp6Tf9jgmT0z67/XWjNr1uh5EQB2AUeBy8BDYAZ4A2SAefUskotFo5NxtjPOl/jskDGiOIQRawRGgSz5R9aN1ZiEWAlwtkDEgnAR2BRGrhS4E2gGy8BrYBy4BwwDN9Qz5JzrZ8joDDtb8THrfAZBOJQGETwfoPwYaAK2pd4nMQDKgWZgMmDcnqA9p5f1N3AcKPLyDKAI6HRj+hAu9VppzHxBZwGIbTa/uwyHEZ1K9OxN5nPmgK3AXbcH3wMH1Uw+NbNY6bk8p9GcL3ICoNuM9069kz2p0e65hOlDvqrCSwn+pidZiQb3yN8lIboS0ZgxV5Zbxjar2SfCB0owm5LYfqDfnRIWGfeuzti0Gb1R815OGx/3RfBKCcZT7KOrCRO66FwBypR9q5vJU8AW41vypI+XIvioBGMJyO0GpkmPF0B1Av+3lc0HEXzOCe3omZsOGbxbNrV7uiP0ymLGuKX0P3lm/9yMMZZl1fgGtASlJZc2ZCkXjM1gzBhyJPqYE8FXJbgeExBZQ25P1GDOrsaQlKitjdDXUT4vgu9KcC3CUCJSoyWOnLI9ZGwvRehKkeFjQQRLcdPv8lzG7KXEp41bbr0nv0TkSYl4Hz9E8EsJ+kOMqswMnE5KzgdwxvgIrKTNwfHTM/uqN8RITgeNdi8lyD1S60P0epXOclKC9cZ5xyoIHjM+DiQluOGXeClhkMwpvemUQVLsbnM6SIqTBslq00xrCoKH15JmkibqOnPRkeRbk4Dc3oBEvS9Nok5z1Onp90m2hRx1xW7m7FE3kPaoS1MslLkkbTHt7tN+sXDO7Dkfz215laRYSFtuVYeQjIOQq1pNuaUL1kdxDtRMDkZcvjVEZyBu5qIK1rWU/LUSkSYF6VTSGxUQIT7f2pK/33xteRqHKk9WqkvTzrBiIArA9qBLk7TANJq8/wRyL1Qr185Kw/pJIVoeISXZVM7F3b2U/pzGCa/AAE4aDv9Snts3tnnUVcDmUVdk88gp9gRE4pTbFzvyQKzCXbiexbbfEjQwsy78J9ahgTnhugfZVA3MDdACzgIXQlvAhmiDOxML1UQfCauw44hKCpLDv0+y+jr+G0J8ic8jktSjSPwBsMt7Ij3X9ZIAAAAASUVORK5CYII=" },
    tiktok: { url: "https://www.tiktok.com/@suplevet", label: "TikTok", icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAADsOAAA7DgHMtqGDAAACCElEQVR4nO3YT6hNURTH8fuunj+lJPEMmD4zBv4NZEAGJDFSiDIx8EqJgcwYmBt6lETPn6GJgVKPkihl5k/+DBRySyZE8dGufeu63bvvOfecc52B3/js3/qetfZZe6/TaJQsjOmvz2XHKxvwF+b9a8CmtLbWOYNB5+uewW9YUecMBl2vO2DQ6bqWuFMXMF7XDLb1DLsxp66AbX3ADZzB+rqUuJ+O/wescwbHEoFbuFcpYDjsMYnN2Nm9oQfswbfxBQ7gVWmAmIvDuB2Pqr+y0sgB2PXcdtzEx6EBsQ9vEkFbwwD2iLMKO3AQa7KW8nIiWKmAuYT5mM0AN3rAuImvya7WqAGP5IAbLSAWxjNxkJ7jCi6FL3uUgCcGgL3GtgEezSoBHyXMQ2NdmsGjWQkglsexsJd+Y2NGn2ZVgFsSxg9y+DSrAtyfMD5XB8CpMgYcjCd8XhQBPJQwns7hM5nwmS0CuClh/D7r9IWTCZ+Zok36R8L8WAaPJfiU8JgaGjAGuJMw/4ldibWLcT+xPrSqlUUB9yQCtINcxOqONYviZfbdgLV3C8F1tIinsul7vAn3a+7dL7auMGCE3BDLWaamS4HL2BPz6mElf1VxKpamiB5jonS4Dsi9+DIk3FUsqAyuA3JZ/E0WPoosehIuHpWD9QANTfgobuElvkboMJKGAess1oaZpszAfwABsRzrh4vHLQAAAABJRU5ErkJggg==" },
  },
} as const;

export const gradients = {
  orange: `linear-gradient(90deg,${brand.colors.orange},${brand.colors.orangeDark})`,
  green: `linear-gradient(90deg,${brand.colors.successLight},${brand.colors.success})`,
  red: `linear-gradient(90deg,${brand.colors.errorLight},${brand.colors.error})`,
  warn: `linear-gradient(90deg,${brand.colors.warnStart},${brand.colors.orange})`,
  pinkOrange: `linear-gradient(90deg,${brand.colors.orange},#E85D75)`,
  sky: `linear-gradient(135deg,${brand.colors.sky},${brand.colors.skyDeep})`,
} as const;
