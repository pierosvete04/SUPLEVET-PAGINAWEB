import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", "class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
  	extend: {
  		colors: {
  			navy: '#253C61',
  			sky: '#99D3DA',
  			'vitality-orange': '#EA8C43',
  			'soft-gray': '#F2F2F2',
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
  			'section-y': '100px'
  		},
  		maxWidth: {
  			container: '1280px'
  		},
  		keyframes: {
  			marquee: {
  				'0%': { transform: 'translateX(0)' },
  				'100%': { transform: 'translateX(-50%)' }
  			}
  		},
  		animation: {
  			// Duración configurable vía la variable CSS --marquee-duration
  			// (default 25s si no se define) — ver components/home/TrustBar.tsx
  			marquee: 'marquee var(--marquee-duration, 25s) linear infinite'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
