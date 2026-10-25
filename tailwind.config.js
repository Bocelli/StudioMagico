// Used only to regenerate vendor/tailwind.css (npm run build:css). The app itself loads the compiled file.
module.exports = {
  content: ['./index.html', './app.js', './lib.js'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Fredoka', 'sans-serif'],
        body: ['Nunito', 'sans-serif'],
      },
      colors: {
        brand: {
          blue: '#3B82F6',
          amber: '#F59E0B',
          coral: '#F97316',
          green: '#10B981',
          purple: '#8B5CF6'
        }
      }
    }
  }
};
