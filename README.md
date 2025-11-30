# Health Disparities Across Asian Ethnic Groups

Interactive D3.js visualizations exploring hidden gaps in healthcare access and outcomes across Asian ethnic groups.

## Overview

This project visualizes health disparities, language barriers, and healthcare access patterns among different Asian ethnic communities using data from the Asian American Quality of Life (AAQoL) survey. The visualizations reveal how limited English proficiency, healthcare coverage, and other factors contribute to unmet health needs across different groups.

## Visualizations

### 1. Ethnicity Access Explorer
An interactive bubble chart showing the relationship between:
- **X-axis**: Share of people with limited English proficiency ("Not well" / "Not at all")
- **Y-axis**: Share with unmet health needs
- **Bubble size**: Population sample size
- **Bubble color**: Self-rated health status (red = more poor/fair health)

Click on any bubble to see detailed breakdowns of English-speaking ability and self-rated health for that ethnic group.

### 2. Cluster Explorer
A scatter plot revealing patterns in stress levels and health outcomes with guided discovery features:
- **"Show me who's struggling most"**: Highlights respondents with high stress and poor health
- **"Why are they clustered here?"**: Shows mini-charts explaining language difficulties, residency duration, and support factors
- **"Who's defying the trend?"**: Identifies outliers with low stress and good health

### 3. Care Funnel
A Sankey diagram showing the healthcare access journey for each ethnic group:
- Stage 0: Among those in poor/fair health, who has a primary care doctor?
- Stage 1: Of those with a doctor, who has health insurance?
- Stage 2: Of those with insurance, who avoids unmet medical needs?
- Stage 3: Of those whose medical needs are met, who also avoids unmet dental needs?

Use the dropdown to select different ethnic groups and the slider to reveal each stage progressively.

## Live Demo

🌐 **View the live visualization**: https://irehkiim.github.io/cs448b-health-disparities/

## Data Source

- **Dataset**: Asian American Quality of Life (AAQoL) Survey
- **Size**: 2.16 MB CSV file with 200+ survey columns
- **Coverage**: Demographics, health status, healthcare access, language barriers, social support, and more

## Technologies Used

- **D3.js v7**: Core visualization library
- **d3-sankey v0.12**: Sankey diagram functionality
- **Vanilla JavaScript**: No frameworks, pure client-side rendering
- **GitHub Pages**: Static site hosting

## Local Development

To run this project locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/irehkiim/cs448b-health-disparities.git
   cd cs448b-health-disparities
   ```

2. Start a local web server (required for loading CSV data):
   ```bash
   # Using Python 3
   python -m http.server 8000

   # OR using Python 2
   python -m SimpleHTTPServer 8000

   # OR using Node.js
   npx http-server -p 8000
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

## Project Structure

```
.
├── index.html              # Main HTML entry point
├── visualization.js        # Converted D3.js visualization code
├── styles.css             # Layout and styling
├── data/
│   └── aaqol_cleaned.csv  # Survey data
├── README.md              # This file
└── .gitignore            # Git ignore rules
```

## Features

- ✅ Pure client-side rendering (no backend needed)
- ✅ Interactive tooltips and hover effects
- ✅ Click interactions for detailed views
- ✅ Responsive design for mobile devices
- ✅ Automatic deployment via GitHub Pages

## Credits

**Project**: Stanford CS 448B Final Project
**Topic**: Hidden gaps in care across Asian ethnic groups
**Visualization Framework**: Originally created in Observable, converted to vanilla D3.js for static deployment

## License

This project is for educational purposes as part of CS 448B coursework.

## Deployment

This site is automatically deployed to GitHub Pages. Any push to the `main` branch will trigger a redeploy.

To update the visualization:
1. Make your changes
2. Commit and push to GitHub
3. GitHub Pages will automatically rebuild and deploy (takes 1-2 minutes)

---

**Stanford CS 448B** | Data Visualization
