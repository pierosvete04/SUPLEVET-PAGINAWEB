import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class", "class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
  	extend: {
  		colors: {
  			navy: '#253C61',
  			sky: '#99D3DA',
  			'vitality-orange': '#EA8C43',
  			// Naranja de marca oscurecido para USAR COMO TEXTO sobre fondos
  			// claros. El #EA8C43 original solo alcanza 2.5:1 sobre blanco, por
  			// debajo del mínimo WCAG incluso para titulares; este llega a 5.4:1.
  			// Para rellenos y superficies sigue usándose `vitality-orange`.
  			//
  			// El nombre NO puede empezar por `orange-`: colisiona con la paleta
  			// `orange` que Tailwind trae de fábrica y la clase nunca se genera.
  			'vitality-orange-ink': '#A8530F',
  			'soft-gray': '#F2F2F2',
  			// Paleta del rediseño del portal de clientes (stitch_pet_portal_experience_revamp) —
  			// prefijo `portal-` para no pisar los tokens de marca del resto del sitio.
  			'portal-navy': '#1E3A5F',
  			'portal-navy-dark': '#142840',
  			'portal-orange': '#FD9755',
  			'portal-orange-dark': '#E57F3C',
  			'portal-teal': '#004046',
  			'portal-teal-light': '#A8DDE3',
  			'portal-teal-mid': '#5BBAC3',
  			'portal-surface': '#FBF9F5',
  			'portal-surface-low': '#E8E5DF',
  			'portal-surface-variant': '#E4E2DE',
  			'portal-card': '#FFFFFF',
  			'portal-text': '#18202E',
  			'portal-muted': '#6B7385',
  			'portal-error': '#BA1A1A',
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		fontFamily: {
  			display: [
  				'var(--font-display)',
  				'Georgia',
  				'serif'
  			],
  			impact: [
  				'var(--font-impact)',
  				'sans-serif'
  			],
  			body: [
  				'var(--font-body)',
  				'sans-serif'
  			]
  		},
  		borderRadius: {
  			lg: '2rem',
  			xl: '3rem',
  			DEFAULT: '1rem',
  			sm: '0.5rem'
  		},
  		spacing: {
  			gutter: '24px',
  			'mobile-margin': '20px',
  			'section-y': '64px'
  		},
  		maxWidth: {
  			// Fluido: igual que antes (1280px) en mobile/tablet, y se ensancha
  			// hasta 1800px en pantallas grandes para que el contenido llegue
  			// casi borde a borde (como el header/TrustBar) en vez de quedar
  			// "flotando" en una caja angosta con márgenes blancos enormes.
  			container: 'clamp(1280px, 94vw, 1800px)'
  		},
  		keyframes: {
  			// Arranca ya desplazado (translateX negativo) y termina en 0 — el
  			// contenido se ve entrar por la izquierda y salir por la derecha
  			// (dirección "hacia la derecha" pedida), en vez de 0 -> negativo.
  			marquee: {
  				'0%': { transform: 'translateX(var(--marquee-distance, -50%))' },
  				'100%': { transform: 'translateX(0)' }
  			},
  			// Barra indeterminada del BrandedLoader (components/ui/branded-loader.tsx)
  			'loader-bar': {
  				'0%': { transform: 'translateX(-100%)' },
  				'100%': { transform: 'translateX(400%)' }
  			},
  			'loader-pulse': {
  				'0%, 100%': { opacity: '1' },
  				'50%': { opacity: '0.55' }
  			}
  		},
  		animation: {
  			// Duración configurable vía la variable CSS --marquee-duration
  			// (default 25s si no se define) — ver components/home/TrustBar.tsx
  			marquee: 'marquee var(--marquee-duration, 25s) linear infinite',
  			'loader-bar': 'loader-bar 1.1s ease-in-out infinite',
  			'loader-pulse': 'loader-pulse 1.6s ease-in-out infinite'
  		}
  	}
  },
  plugins: [tailwindcssAnimate],
};

export default config;
