function _d3(require){return(
require("d3@7")
)}

async function _data(d3,FileAttachment){return(
d3.csvParse(
  await FileAttachment("aaqol_cleaned.csv").text(),
  d3.autoType
)
)}

function _ethnicityAccessExplorer(d3,data)
{
  const width = 900;
  const height = 500;
  const margin = { top: 40, right: 260, bottom: 60, left: 70 };

  const healthOrder = ["Poor", "Fair", "Good", "Very Good", "Excellent"];
  const englishOrder = ["Very well", "Well", "Not well", "Not at all"];

  // ---------- 1. Aggregate by ethnicity ----------
  const grouped = d3.group(
    data.filter(d => d.Ethnicity != null),
    d => d.Ethnicity
  );

  const ethStats = Array.from(grouped, ([ethnicity, rows]) => {
    const n = rows.length;

    const lowEnglish = d3.mean(rows, r =>
      ["Not well", "Not at all"].includes(r["English Speaking"]) ? 1 : 0
    ) || 0;

    const unmetNeed = d3.mean(rows, r =>
      r["Unmet Health Need"] === "Yes" ? 1 : 0
    ) || 0;

    const poorHealth = d3.mean(rows, r =>
      ["Poor", "Fair"].includes(r["Present Health"]) ? 1 : 0
    ) || 0;

    return { ethnicity, n, lowEnglish, unmetNeed, poorHealth, rows };
  });

  // sort for tooltips + legend later
  ethStats.sort((a, b) => d3.ascending(a.ethnicity, b.ethnicity));

  const maxLowEnglish = d3.max(ethStats, d => d.lowEnglish) || 0.5;
  const maxUnmet = d3.max(ethStats, d => d.unmetNeed) || 0.2;
  const maxPoorHealth = d3.max(ethStats, d => d.poorHealth) || 0.2;
  const maxN = d3.max(ethStats, d => d.n);

  // ---------- 2. Scales ----------
  const x = d3.scaleLinear()
    .domain([0, maxLowEnglish]).nice()
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain([0, maxUnmet]).nice()
    .range([height - margin.bottom, margin.top]);

  const r = d3.scaleSqrt()
    .domain([0, maxN])
    .range([4, 20]);

  const color = d3.scaleSequential(d3.interpolateRdYlGn) // red = worse health
    .domain([maxPoorHealth, 0]); // more poor health → more red

  const pct = d3.format(".0%");

  // ---------- 3. Layout container ----------
  const container = d3.create("div")
    .style("display", "grid")
    .style("grid-template-columns", "3fr 2fr")
    .style("grid-template-rows", "auto auto")
    .style("gap", "16px");

  const controls = container.append("div")
    .style("grid-column", "1 / 3")
    .style("display", "flex")
    .style("flex-wrap", "wrap")
    .style("align-items", "center")
    .style("gap", "12px");

  controls.append("div")
    .style("font-weight", "bold")
    .text("Hidden gaps in care across Asian ethnic groups");

  const narrative = controls.append("div")
    .style("font-size", "0.9rem")
    .style("max-width", "650px")
    .text("Each circle is an ethnicity. Right: limited English. Up: unmet health needs. Color shows how often people report poor/fair health. Click a circle to break down English ability and self-rated health for that group.");

  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("grid-column", "1 / 2")
    .style("grid-row", "2 / 3");

  // ---------- 4. Axes ----------
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(
      d3.axisBottom(x)
        .tickFormat(pct)
        .ticks(5)
    )
    .call(g =>
      g.append("text")
        .attr("x", (width - margin.left - margin.right) / 2 + margin.left)
        .attr("y", 40)
        .attr("fill", "currentColor")
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .text("Share with limited English (“Not well” / “Not at all”)")
    );

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(
      d3.axisLeft(y)
        .tickFormat(pct)
        .ticks(5)
    )
    .call(g =>
      g.append("text")
        .attr("x", -margin.left + 10)
        .attr("y", margin.top - 20)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .style("font-weight", "bold")
        .text("Share with unmet health need")
    );

  // guide line y = x (just visual cue, optional)
  svg.append("line")
    .attr("x1", x(0))
    .attr("y1", y(0))
    .attr("x2", x(Math.min(maxLowEnglish, maxUnmet)))
    .attr("y2", y(Math.min(maxLowEnglish, maxUnmet)))
    .attr("stroke", "#ccc")
    .attr("stroke-dasharray", "4,4");

  // ---------- 5. Tooltip ----------
  const tooltip = d3.select("body").append("div")
    .style("position", "fixed")
    .style("pointer-events", "none")
    .style("background", "rgba(255,255,255,0.95)")
    .style("border", "1px solid #aaa")
    .style("padding", "4px 6px")
    .style("border-radius", "3px")
    .style("font-size", "11px")
    .style("display", "none");

  // ---------- 6. Scatter points ----------
  let selected = ethStats.find(d => d.ethnicity === "Vietnamese") || ethStats[0];

  const circles = svg.append("g")
    .selectAll("circle")
    .data(ethStats)
    .join("circle")
      .attr("cx", d => x(d.lowEnglish))
      .attr("cy", d => y(d.unmetNeed))
      .attr("r", d => r(d.n))
      .attr("fill", d => color(d.poorHealth))
      .attr("stroke", d => d === selected ? "#000" : "#666")
      .attr("stroke-width", d => d === selected ? 2 : 1)
      .attr("opacity", 0.9)
      .on("mouseover", (event, d) => {
        tooltip.style("display", "block")
          .html(`
            <div><strong>${d.ethnicity}</strong> (n = ${d.n})</div>
            <div>Limited English: ${pct(d.lowEnglish)}</div>
            <div>Unmet health need: ${pct(d.unmetNeed)}</div>
            <div>Poor/Fair health: ${pct(d.poorHealth)}</div>
          `);
      })
      .on("mousemove", event => {
        tooltip
          .style("left", (event.clientX + 10) + "px")
          .style("top", (event.clientY - 10) + "px");
      })
      .on("mouseout", () => tooltip.style("display", "none"))
      .on("click", (event, d) => {
        selected = d;
        circles
          .attr("stroke", e => e === selected ? "#000" : "#666")
          .attr("stroke-width", e => e === selected ? 2 : 1);
        updateSidePanel(selected);
      });

  // labels next to points
  svg.append("g")
    .selectAll("text.ethLabel")
    .data(ethStats)
    .join("text")
      .attr("class", "ethLabel")
      .attr("x", d => x(d.lowEnglish) + r(d.n) + 4)
      .attr("y", d => y(d.unmetNeed) + 3)
      .attr("font-size", "11px")
      .text(d => d.ethnicity);

  // legend for color
  const legendColor = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 40}, ${margin.top})`);

  legendColor.append("text")
    .text("Poor/Fair health rate")
    .attr("font-weight", "bold")
    .attr("font-size", "11px");

  const legendHeight = 100;
  const legendWidth = 14;

  const legendScale = d3.scaleLinear()
    .domain(color.domain())
    .range([0, legendHeight]);

  const legendAxis = d3.axisRight(legendScale)
    .ticks(4)
    .tickFormat(pct);

  const legendGradId = "health-gradient";

  const defs = svg.append("defs");
  const gradient = defs.append("linearGradient")
    .attr("id", legendGradId)
    .attr("x1", "0%").attr("x2", "0%")
    .attr("y1", "0%").attr("y2", "100%");

  const gradientStops = d3.range(0, 1.01, 0.25);
  gradientStops.forEach(t => {
    gradient.append("stop")
      .attr("offset", `${t * 100}%`)
      .attr("stop-color", color(legendScale.invert(t * legendHeight)));
  });

  legendColor.append("rect")
    .attr("x", 0)
    .attr("y", 10)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .attr("fill", `url(#${legendGradId})`);

  legendColor.append("g")
    .attr("transform", `translate(${legendWidth}, 10)`)
    .call(legendAxis)
    .selectAll("text")
      .attr("font-size", "10px");

  // ---------- 7. Side panel with mini bar charts ----------
  const sidePanel = container.append("div")
    .style("grid-column", "2 / 3")
    .style("grid-row", "2 / 3")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("gap", "10px")
    .style("font-size", "0.85rem");

  const sideTitle = sidePanel.append("div")
    .style("font-weight", "bold");

  const sideSubtitle = sidePanel.append("div")
    .style("font-size", "0.85rem");

  const miniGrid = sidePanel.append("div")
    .style("display", "grid")
    .style("grid-template-columns", "1fr")
    .style("gap", "8px");

  const englishDiv = miniGrid.append("div");
  const healthDiv = miniGrid.append("div");

  function barChart(selection, rows, field, order, title) {
    const countsMap = d3.rollup(
      rows.filter(d => d[field] != null && d[field] !== ""),
      v => v.length,
      d => d[field]
    );
    const counts = order.map(key => ({
      key,
      value: countsMap.get(key) || 0
    }));
    const total = d3.sum(counts, d => d.value) || 1;

    const w = 260;
    const h = 120;
    const m = { top: 18, right: 10, bottom: 18, left: 90 };

    selection.selectAll("*").remove();
    const svgMini = selection.append("svg")
      .attr("width", w)
      .attr("height", h);

    svgMini.append("text")
      .attr("x", m.left)
      .attr("y", m.top - 6)
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .text(`${title} (n = ${total})`);

    const xScale = d3.scaleLinear()
      .domain([0, d3.max(counts, d => d.value)]).nice()
      .range([m.left, w - m.right]);

    const yScale = d3.scaleBand()
      .domain(order)
      .range([m.top, h - m.bottom])
      .padding(0.2);

    svgMini.selectAll("rect.bar")
      .data(counts)
      .join("rect")
        .attr("class", "bar")
        .attr("x", m.left)
        .attr("y", d => yScale(d.key))
        .attr("width", d => xScale(d.value) - m.left)
        .attr("height", yScale.bandwidth())
        .attr("fill", "#777");

    svgMini.append("g")
      .attr("transform", `translate(${m.left},0)`)
      .call(d3.axisLeft(yScale).tickSize(0))
      .selectAll("text")
        .attr("font-size", "9px");

    svgMini.append("g")
      .attr("transform", `translate(0,${h - m.bottom})`)
      .call(d3.axisBottom(xScale).ticks(4).tickSizeOuter(0))
      .selectAll("text")
        .attr("font-size", "9px");
  }

  function updateSidePanel(stat) {
    const { ethnicity, n, lowEnglish, unmetNeed, poorHealth, rows } = stat;

    sideTitle.text(`${ethnicity}: who is being left behind?`);

    sideSubtitle.html(`
      <div>Sample size: <strong>${n}</strong></div>
      <div>Limited English: <strong>${pct(lowEnglish)}</strong></div>
      <div>Unmet health need: <strong>${pct(unmetNeed)}</strong></div>
      <div>Poor/Fair physical health: <strong>${pct(poorHealth)}</strong></div>
    `);

    barChart(
      englishDiv,
      rows,
      "English Speaking",
      englishOrder,
      "English speaking ability"
    );

    barChart(
      healthDiv,
      rows,
      "Present Health",
      healthOrder,
      "Self-rated physical health"
    );
  }

  // initial side panel state
  updateSidePanel(selected);

  return container.node();
}


function _healthOrder(){return(
["Poor", "Fair", "Good", "Very Good", "Excellent"]
)}

function _processed(data,healthOrder){return(
data
  .map(d => {
    const phys = d["Present Health"];
    const mental = d["Present Mental Health"];

    const physIdx = healthOrder.indexOf(phys);
    const mentalIdx = healthOrder.indexOf(mental);

    const healthScore = physIdx === -1 ? null : physIdx + 1;   // 1 = Poor ... 5 = Excellent
    const mentalScore = mentalIdx === -1 ? null : mentalIdx + 1;

    // define stress as inverse of mental health (higher = worse)
    const stressScore =
      mentalScore == null ? null : 6 - mentalScore;            // 1..5

    return {
      ...d,
      healthScore,
      mentalScore,
      stressScore
    };
  })
  .filter(d => d.healthScore != null && d.stressScore != null)
)}

function _clusterExplorer(processed,d3)
{
  // ==== CONFIG ====
  const STRESS_FIELD = "stressScore";       // derived from Present Mental Health
  const HEALTH_FIELD = "healthScore";       // derived from Present Health
  const ETHNICITY_FIELD = "Ethnicity";      // change to "Identify Ethnically" if needed

  // thresholds for "struggling" cluster (tune to your distributions)
  const STRESS_HIGH_THRESHOLD = 4;          // high stress
  const HEALTH_LOW_THRESHOLD = 2;           // poor physical health

  // thresholds for "defying" group (low stress, good health)
  const STRESS_LOW_THRESHOLD = 2;
  const HEALTH_HIGH_THRESHOLD = 4;

  // explanatory mini-chart fields
  const LANGUAGE_DIFFICULTY_FIELD = "English Difficulties";
  const RESIDENCY_FIELD = "Duration of Residency";
  const INTERPRETATION_FIELD = "Familiarity with America";


  const width = 800;
  const height = 500;
  const margin = { top: 40, right: 260, bottom: 60, left: 60 };

  const filtered = processed;

  // predicates
  const isStruggling = d =>
    d[STRESS_FIELD] >= STRESS_HIGH_THRESHOLD &&
    d[HEALTH_FIELD] <= HEALTH_LOW_THRESHOLD;

  const isDefyingTrend = d =>
    d[STRESS_FIELD] <= STRESS_LOW_THRESHOLD &&
    d[HEALTH_FIELD] >= HEALTH_HIGH_THRESHOLD;

  const strugglingPoints = filtered.filter(isStruggling);
  const defyingPoints = filtered.filter(isDefyingTrend);

  // ==== SCALES ====
  const x = d3.scaleLinear()
    .domain(d3.extent(filtered, d => d[STRESS_FIELD])).nice()
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain(d3.extent(filtered, d => d[HEALTH_FIELD])).nice()
    .range([height - margin.bottom, margin.top]);

  const ethnicitiesInCluster = Array.from(
    new Set(filtered.map(d => d[ETHNICITY_FIELD]).filter(e => e != null))
  );

  const color = d3.scaleOrdinal()
    .domain(ethnicitiesInCluster)
    .range(d3.schemeTableau10);

  // ==== MAIN LAYOUT ====
  const container = d3.create("div")
    .style("display", "grid")
    .style("grid-template-columns", "3fr 2fr")
    .style("grid-template-rows", "auto auto")
    .style("gap", "16px");

  // controls
  const controls = container.append("div")
    .style("grid-column", "1 / 3")
    .style("display", "flex")
    .style("flex-wrap", "wrap")
    .style("align-items", "center")
    .style("gap", "8px");

  controls.append("span")
    .style("font-weight", "bold")
    .text("Cluster Explorer – Guided Discovery");

  const btnShowStruggling = controls.append("button")
    .text("Show me who's struggling most")
    .style("padding", "4px 8px");

  const btnExplainCluster = controls.append("button")
    .text("Why are they clustered here?")
    .style("padding", "4px 8px");

  const btnDefying = controls.append("button")
    .text("Who's defying the trend?")
    .style("padding", "4px 8px");

  const narrative = controls.append("div")
    .style("margin-left", "12px")
    .style("font-size", "0.9rem")
    .style("max-width", "650px")
    .text("Start with the full scatter. Then step through the buttons to reveal clusters and outliers.");

  // main scatter
  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height);

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x))
    .call(g =>
      g.append("text")
        .attr("x", (width - margin.left - margin.right) / 2 + margin.left)
        .attr("y", 40)
        .attr("fill", "currentColor")
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .text("Derived stress (higher = worse mental health)")
    );

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))
    .call(g =>
      g.append("text")
        .attr("x", -margin.left + 10)
        .attr("y", margin.top - 20)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .style("font-weight", "bold")
        .text("Physical health (1–5)")
    );

  const points = svg.append("g")
    .attr("class", "points")
    .selectAll("circle")
    .data(filtered)
    .join("circle")
      .attr("cx", d => x(d[STRESS_FIELD]))
      .attr("cy", d => y(d[HEALTH_FIELD]))
      .attr("r", 3)
      .attr("fill", d => color(d[ETHNICITY_FIELD] ?? "Other"))
      .attr("opacity", 0.6);


  // quadrant rect for struggling region
  const strugglingRect = svg.append("rect")
    .attr("x", x(STRESS_HIGH_THRESHOLD))
    .attr("y", y(HEALTH_LOW_THRESHOLD))
    .attr("width", x.range()[1] - x(STRESS_HIGH_THRESHOLD))
    .attr("height", (height - margin.bottom) - y(HEALTH_LOW_THRESHOLD))
    .attr("fill", "#f3d7d7")
    .attr("stroke", "#c44")
    .attr("stroke-dasharray", "4,4")
    .attr("opacity", 0);

  // legend
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);

  legend.append("text")
    .text("Cluster ethnicity")
    .style("font-weight", "bold")
    .attr("dy", 0);

  const legendItems = legend.selectAll("g.item")
    .data(ethnicitiesInCluster)
    .join("g")
      .attr("class", "item")
      .attr("transform", (d, i) => `translate(0, ${(i + 1) * 18})`)
      .style("opacity", 0);

  legendItems.append("rect")
    .attr("width", 10)
    .attr("height", 10)
    .attr("y", -8)
    .attr("fill", d => color(d));

  legendItems.append("text")
    .attr("x", 16)
    .attr("dy", 0)
    .text(d => d);

  // side panel
  const sidePanel = container.append("div")
    .style("grid-row", "2 / 3")
    .style("grid-column", "2 / 3")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("gap", "12px")
    .style("font-size", "0.85rem");

  sidePanel.append("div")
    .style("font-weight", "bold")
    .text("Why this cluster exists and who defies it");

  const clusterSummary = sidePanel.append("div")
    .style("min-height", "60px")
    .style("border-bottom", "1px solid #eee")
    .text("Use the buttons above to reveal patterns; this panel will explain them.");

  const miniChartsContainer = sidePanel.append("div")
    .style("display", "grid")
    .style("grid-template-columns", "1fr")
    .style("gap", "8px");

  const langChartDiv = miniChartsContainer.append("div");
  const residencyChartDiv = miniChartsContainer.append("div");
  const interpretationChartDiv = miniChartsContainer.append("div");

  // mini bar chart helper
  function renderMiniBarChart(selection, data, field, { title, maxBars = 5 } = {}) {
    if (!field || !data.length) {
      selection.selectAll("*").remove();
      selection.append("div").text("No data available.");
      return;
    }

    const counts = Array.from(
      d3.rollup(
        data.filter(d => d[field] != null && d[field] !== ""),
        v => v.length,
        d => d[field]
      ),
      ([key, value]) => ({ key, value })
    ).sort((a, b) => d3.descending(a.value, b.value))
     .slice(0, maxBars);

    if (!counts.length) {
      selection.selectAll("*").remove();
      selection.append("div").text("No data available.");
      return;
    }

    const w = 240;
    const h = 120;
    const m = { top: 18, right: 10, bottom: 18, left: 70 };

    selection.selectAll("*").remove();

    const svgMini = selection.append("svg")
      .attr("width", w)
      .attr("height", h);

    svgMini.append("text")
      .attr("x", m.left)
      .attr("y", m.top - 6)
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .text(title);

    const xScale = d3.scaleLinear()
      .domain([0, d3.max(counts, d => d.value)]).nice()
      .range([m.left, w - m.right]);

    const yScale = d3.scaleBand()
      .domain(counts.map(d => String(d.key)))
      .range([m.top, h - m.bottom])
      .padding(0.2);

    svgMini.selectAll("rect.bar")
      .data(counts)
      .join("rect")
        .attr("class", "bar")
        .attr("x", m.left)
        .attr("y", d => yScale(String(d.key)))
        .attr("width", d => xScale(d.value) - m.left)
        .attr("height", yScale.bandwidth())
        .attr("fill", "#888");

    svgMini.append("g")
      .attr("transform", `translate(${m.left},0)`)
      .call(d3.axisLeft(yScale).tickSize(0))
      .selectAll("text")
        .attr("font-size", "9px");

    svgMini.append("g")
      .attr("transform", `translate(0,${h - m.bottom})`)
      .call(d3.axisBottom(xScale).ticks(4).tickSizeOuter(0))
      .selectAll("text")
        .attr("font-size", "9px");
  }

  // tooltip
  const tooltip = d3.select("body").append("div")
    .style("position", "fixed")
    .style("pointer-events", "none")
    .style("background", "rgba(255,255,255,0.95)")
    .style("border", "1px solid #aaa")
    .style("padding", "4px 6px")
    .style("border-radius", "3px")
    .style("font-size", "11px")
    .style("display", "none");

  points
    .on("mouseover", (event, d) => {
      tooltip.style("display", "block")
        .html(`
          <div><strong>${ETHNICITY_FIELD}:</strong> ${d[ETHNICITY_FIELD] ?? "N/A"}</div>
          <div><strong>Stress:</strong> ${d[STRESS_FIELD]}</div>
          <div><strong>Health:</strong> ${d[HEALTH_FIELD]}</div>
        `);
    })
    .on("mousemove", event => {
      tooltip
        .style("left", (event.clientX + 10) + "px")
        .style("top", (event.clientY - 10) + "px");
    })
    .on("mouseout", () => tooltip.style("display", "none"));

  // ==== Interaction 1 – highlight struggling cluster ====
  btnShowStruggling.on("click", () => {
    narrative.text("Respondents in the high-stress / poor-health quadrant are highlighted; note which ethnic groups are concentrated there.");

    strugglingRect
      .transition().duration(600)
      .attr("opacity", 0.25);

    legendItems
      .transition().duration(600)
      .style("opacity", 1);

    points
      .transition().duration(600)
      .attr("fill", d => color(d[ETHNICITY_FIELD] ?? "Other"))
      .attr("r", d => isStruggling(d) ? 5 : 3)
      .attr("opacity", d => isStruggling(d) ? 0.95 : 0.2);
  });

  // ==== Interaction 2 – mini-charts explaining cluster ====
  btnExplainCluster.on("click", () => {
    narrative.text("Within the struggling cluster, you can inspect language difficulties, recent immigration, and related factors.");

    clusterSummary.html(`
      <strong>Within the struggling cluster</strong>, the mini-charts summarize:
      <ul style="margin: 4px 0 0 16px; padding: 0;">
        <li>How many report difficulty with English</li>
        <li>How long they have lived in the U.S.</li>
        <li>One proxy for care access / support</li>
      </ul>
    `);

    renderMiniBarChart(
      langChartDiv,
      strugglingPoints,
      LANGUAGE_DIFFICULTY_FIELD,
      { title: "English difficulties (cluster)" }
    );

    renderMiniBarChart(
      residencyChartDiv,
      strugglingPoints,
      RESIDENCY_FIELD,
      { title: "Duration of residency (cluster)" }
    );

    renderMiniBarChart(
      interpretationChartDiv,
      strugglingPoints,
      INTERPRETATION_FIELD,
      { title: "Care / support proxy (cluster)" }
    );
  });

  // ==== Interaction 3 – outliers defying the trend ====
  btnDefying.on("click", () => {
    narrative.text("Now we highlight respondents with low stress and good health—people defying the overall pattern. Comparing their profiles to the cluster suggests protective factors.");

    strugglingRect
      .transition().duration(400)
      .attr("opacity", 0.12);

    points
      .transition().duration(600)
      .attr("fill", d => {
        if (isDefyingTrend(d)) return "#1f77b4";
        if (isStruggling(d)) {
          const e = d[ETHNICITY_FIELD];
          return ethnicitiesInCluster.includes(e) ? color(e) : "#d62728";
        }
        return "#d0d0d0";
      })
      .attr("r", d => isDefyingTrend(d) ? 5 : (isStruggling(d) ? 4 : 2.5))
      .attr("opacity", d =>
        isDefyingTrend(d) ? 1.0 :
        isStruggling(d) ? 0.8 : 0.25
      );

    clusterSummary.html(`
      <strong>Outliers who defy the trend</strong> have low stress and good health.
      Contrasting their language access, residency, and support patterns with the struggling group
      helps you hypothesize protective factors.
    `);

    renderMiniBarChart(
      langChartDiv,
      defyingPoints,
      LANGUAGE_DIFFICULTY_FIELD,
      { title: "English difficulties (defying group)" }
    );

    renderMiniBarChart(
      residencyChartDiv,
      defyingPoints,
      RESIDENCY_FIELD,
      { title: "Duration of residency (defying group)" }
    );

    renderMiniBarChart(
      interpretationChartDiv,
      defyingPoints,
      INTERPRETATION_FIELD,
      { title: "Care / support proxy (defying group)" }
    );
  });

  return container.node();
}


function _sankeyModule(require){return(
require("d3-sankey@0.12")
)}

function _careFunnelSankey(sankeyModule,data,d3)
{
  // Use d3-sankey loaded earlier
  const { sankey, sankeyLinkHorizontal } = sankeyModule;

  const width = 900;
  const height = 520;
  const margin = { top: 60, right: 40, bottom: 20, left: 40 };

  const ETH_FIELD = "Ethnicity";

  // *** Actual AAQoL columns ***
  const HEALTH_PROBLEM_FIELD = "Present Health";      // Poor / Fair / Good / etc.
  const PRIMARY_CARE_FIELD   = "Primary Care";        // Yes / 0
  const INSURANCE_FIELD      = "Health Insurance";    // Yes / 0
  const UNMET_MED_FIELD      = "Unmet Health Need";   // Yes / 0
  const UNMET_DENT_FIELD     = "Unmet Dental Needs";  // Yes / 0

  // ---------- helpers to interpret the codes ----------

  function hasHealthProblem(row) {
    const v = row[HEALTH_PROBLEM_FIELD];
    return v === "Poor" || v === "Fair";
  }

  function hasPrimaryCare(row) {
    return row[PRIMARY_CARE_FIELD] === "Yes";
  }

  function hasInsurance(row) {
    return row[INSURANCE_FIELD] === "Yes";
  }

  function unmetMedical(row) {
    return row[UNMET_MED_FIELD] === "Yes";
  }

  function unmetDental(row) {
    return row[UNMET_DENT_FIELD] === "Yes";
  }

  // ---------- ethnicity list ----------
  const ethnicities = Array.from(
    new Set(data.map(d => d[ETH_FIELD]).filter(d => d != null && d !== ""))
  ).sort();

  const container = d3.create("div")
    .style("font-family", "system-ui, -apple-system, BlinkMacSystemFont, sans-serif");

  // ---- controls ----
  const controls = container.append("div")
    .style("display", "flex")
    .style("align-items", "center")
    .style("gap", "12px")
    .style("margin-bottom", "6px");

  controls.append("div")
    .style("font-weight", "bold")
    .text("Who slips through the cracks?");

  const select = controls.append("select");
  select.selectAll("option")
    .data(ethnicities)
    .join("option")
      .attr("value", d => d)
      .text(d => d);

  const stageLabel = controls.append("div")
    .style("margin-left", "16px")
    .style("font-size", "0.85rem");

  const stageSlider = controls.append("input")
    .attr("type", "range")
    .attr("min", 0)
    .attr("max", 3)   // now we have 4 stages: 0–3
    .attr("step", 1)
    .style("width", "200px");

  controls.append("span")
    .style("font-size", "0.8rem")
    .text("Drag to reveal stages of the care funnel");

  const narrative = container.append("div")
    .style("font-size", "0.9rem")
    .style("margin", "6px 0 10px 0")
    .style("max-width", "720px");

  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height);

  const g = svg.append("g");

  svg.append("text")
    .attr("x", margin.left)
    .attr("y", 24)
    .attr("font-size", 14)
    .attr("font-weight", "bold")
    .text("From poor health to full coverage: step-down care funnel");

  let currentStage = 3;
  let linkSel = null;
  let nodeSel = null;
  let graphLinksByNode = new Map();
  const format = d3.format(",");

  const stageDescriptions = [
    "Stage 0 – Among those in poor/fair health, who has a usual primary care doctor?",
    "Stage 1 – Of those with a doctor, who has health insurance?",
    "Stage 2 – Of those with insurance, who avoids unmet medical needs?",
    "Stage 3 – Of those whose medical needs are met, who also avoids unmet dental needs?"
  ];

  function updateStage(k) {
    currentStage = k;
    stageLabel.text(stageDescriptions[k]);

    if (!linkSel || !nodeSel) return;

    linkSel
      .transition().duration(300)
      .attr("stroke-opacity", d =>
        d.funnelStage <= k ? 0.9 :
        d.funnelStage === k + 1 ? 0.25 :
        0.05
      );

    nodeSel
      .transition().duration(300)
      .attr("opacity", d => {
        const linksForNode = graphLinksByNode.get(d.index) || [];
        return linksForNode.some(l => l.funnelStage <= k) ? 1 : 0.25;
      });
  }

  stageSlider.on("input", event => {
    updateStage(+event.target.value);
  });

  // ---------- build funnel for one ethnicity ----------

  function buildFunnel(rows) {
    const subset = rows.filter(hasHealthProblem);
    const total = subset.length;

    if (!total) return { total: 0, nodes: [], links: [] };

    let n0_pc = 0, n0_noPC = 0;
    let n1_ins = 0, n1_noIns = 0;
    let n2_noUnmetMed = 0, n2_unmetMed = 0;
    let n3_noUnmetDent = 0, n3_unmetDent = 0;

    for (const r of subset) {
      const pc   = hasPrimaryCare(r);
      const ins  = hasInsurance(r);
      const uMed = unmetMedical(r);
      const uDen = unmetDental(r);

      // Stage 0: primary care
      if (pc) n0_pc++; else n0_noPC++;

      // Stage 1: insurance (only among those with primary care)
      if (pc) {
        if (ins) n1_ins++; else n1_noIns++;

        // Stage 2: unmet medical (only among those with insurance)
        if (ins) {
          if (!uMed) n2_noUnmetMed++; else n2_unmetMed++;

          // Stage 3: unmet dental (only among those without unmet medical)
          if (!uMed) {
            if (!uDen) n3_noUnmetDent++; else n3_unmetDent++;
          }
        }
      }
    }

    const nodes = [
      { name: "Poor/Fair health" },         // 0
      { name: "Has primary care doctor" },  // 1
      { name: "No primary care doctor" },   // 2
      { name: "Has health insurance" },     // 3
      { name: "No health insurance" },      // 4
      { name: "No unmet medical need" },    // 5
      { name: "Unmet medical need" },       // 6
      { name: "No unmet dental need" },     // 7
      { name: "Unmet dental need" }         // 8
    ];

    const links = [];
    const pushLink = (s, t, v, stage) => { if (v > 0) links.push({ source: s, target: t, value: v, funnelStage: stage }); };

    // Stage 0
    pushLink(0, 1, n0_pc, 0);
    pushLink(0, 2, n0_noPC, 0);

    // Stage 1
    pushLink(1, 3, n1_ins, 1);
    pushLink(1, 4, n1_noIns, 1);

    // Stage 2
    pushLink(3, 5, n2_noUnmetMed, 2);
    pushLink(3, 6, n2_unmetMed, 2);

    // Stage 3
    pushLink(5, 7, n3_noUnmetDent, 3);
    pushLink(5, 8, n3_unmetDent, 3);

    return { total, nodes, links };
  }

  // ---------- render for selected ethnicity ----------

  function renderForEthnicity(eth) {
    const rows = data.filter(d => d[ETH_FIELD] === eth);
    const { total, nodes, links } = buildFunnel(rows);

    g.selectAll("*").remove();
    graphLinksByNode = new Map();
    linkSel = null;
    nodeSel = null;

    if (!total || !links.length) {
      narrative.text(
        `For ${eth}, there are no respondents with poor/fair health and complete coverage/unmet-need data.`
      );
      g.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#666")
        .text("No valid funnel data for this group.");
      return;
    }

    narrative.html(
      `<strong>${eth}</strong>: ${format(total)} respondents report <strong>poor or fair health</strong>. ` +
      `The diagram shows how many of them have a usual primary-care doctor, insurance, and no unmet medical/dental needs — and where they fall off.`
    );

    const layout = sankey()
      .nodeWidth(18)
      .nodePadding(16)
      .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]]);

    const graph = layout({
      nodes: nodes.map(d => ({ ...d })),
      links: links.map(d => ({ ...d }))
    });

    // adjacency map for node highlighting
    graphLinksByNode = new Map();
    graph.links.forEach(l => {
      const s = l.source.index;
      const t = l.target.index;
      if (!graphLinksByNode.has(s)) graphLinksByNode.set(s, []);
      if (!graphLinksByNode.has(t)) graphLinksByNode.set(t, []);
      graphLinksByNode.get(s).push(l);
      graphLinksByNode.get(t).push(l);
    });

    const maxVal = d3.max(graph.links, d => d.value);
    const linkOpacity = d3.scaleLinear().domain([1, maxVal]).range([0.2, 0.9]);

    const stageColor = d3.scaleOrdinal()
      .domain([0, 1, 2, 3])
      .range(["#4c78a8", "#f58518", "#54a24b", "#e45756"]);

    // links
    linkSel = g.append("g")
      .attr("fill", "none")
      .selectAll("path")
      .data(graph.links)
      .join("path")
        .attr("d", sankeyLinkHorizontal())
        .attr("stroke", d => stageColor(d.funnelStage))
        .attr("stroke-width", d => Math.max(1, d.width))
        .attr("stroke-opacity", d => linkOpacity(d.value))
        .sort((a, b) => b.width - a.width);

    linkSel.append("title")
      .text(d =>
        `${graph.nodes[d.source.index].name} → ${graph.nodes[d.target.index].name}\n` +
        `${format(d.value)} respondents`
      );

    // nodes
    nodeSel = g.append("g")
      .selectAll("g.node")
      .data(graph.nodes)
      .join("g")
        .attr("class", "node");

    nodeSel.append("rect")
      .attr("x", d => d.x0)
      .attr("y", d => d.y0)
      .attr("height", d => d.y1 - d.y0)
      .attr("width", d => d.x1 - d.x0)
      .attr("fill", "#666")
      .attr("stroke", "#333");

    nodeSel.append("title")
      .text(d => `${d.name}\n${format(d.value)} respondents`);

    nodeSel.append("text")
      .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr("y", d => (d.y0 + d.y1) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
      .attr("font-size", 11)
      .text(d => d.name);

    // hover highlight
    nodeSel.on("mouseover", (event, d) => {
      const linksForNode = graphLinksByNode.get(d.index) || [];
      linkSel.attr("stroke-opacity", l => linksForNode.includes(l) ? 0.95 : 0.05);
    }).on("mouseout", () => updateStage(currentStage));

    linkSel.on("mouseover", (event, d) => {
      linkSel.attr("stroke-opacity", l => l === d ? 0.95 : 0.05);
    }).on("mouseout", () => updateStage(currentStage));

    // reset slider view
    stageSlider.property("value", currentStage);
    updateStage(currentStage);
  }

  // initial render
  const initialEth = ethnicities[0];
  select.property("value", initialEth);
  currentStage = 3;
  renderForEthnicity(initialEth);

  select.on("change", event => {
    renderForEthnicity(event.target.value);
  });

  return container.node();
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["aaqol_cleaned.csv", {url: new URL("./files/7d55479e9f8cbbf70f43de32c57e0f59cde305bd32c46f6488d48f9d0f2169758fee15573f255b2ab1a0f084d7a19e5b0c9a125e3d8fbe682d72489cd4984c5c.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("data")).define("data", ["d3","FileAttachment"], _data);
  main.variable(observer("viewof ethnicityAccessExplorer")).define("viewof ethnicityAccessExplorer", ["d3","data"], _ethnicityAccessExplorer);
  main.variable(observer("ethnicityAccessExplorer")).define("ethnicityAccessExplorer", ["Generators", "viewof ethnicityAccessExplorer"], (G, _) => G.input(_));
  main.variable(observer("healthOrder")).define("healthOrder", _healthOrder);
  main.variable(observer("processed")).define("processed", ["data","healthOrder"], _processed);
  main.variable(observer("viewof clusterExplorer")).define("viewof clusterExplorer", ["processed","d3"], _clusterExplorer);
  main.variable(observer("clusterExplorer")).define("clusterExplorer", ["Generators", "viewof clusterExplorer"], (G, _) => G.input(_));
  main.variable(observer("sankeyModule")).define("sankeyModule", ["require"], _sankeyModule);
  main.variable(observer("viewof careFunnelSankey")).define("viewof careFunnelSankey", ["sankeyModule","data","d3"], _careFunnelSankey);
  main.variable(observer("careFunnelSankey")).define("careFunnelSankey", ["Generators", "viewof careFunnelSankey"], (G, _) => G.input(_));
  return main;
}
