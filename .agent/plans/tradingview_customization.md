---
description: Implementation plan for customizing the TradingView chart to match a specific design with a custom text-based toolbar and themed colors.
---

# TradingView Customization Implementation Plan

## Objective
Customize the TradingView chart integration to match the user's design reference:
1.  **Custom Toolbar**: Replace the default icon-based toolbar with a text-based toolbar (1d, Candles, Indicators, Lines, Annotations, etc.).
2.  **Theming**: Apply specific colors for the dark theme, candles, and background to match the application's aesthetic (`#19010E`).
3.  **Layout**: Ensure seamless integration with the main application layout.

## 1. Color Palette & Theming
Define the specific color overrides for the TradingView widget to match the design.

*   **Background**: `#19010E` (App background)
*   **Grid**: Transparent or very subtle (`#2d1b24`)
*   **Candle Up**: `#00E396` (Green)
*   **Candle Down**: `#FF4560` (Red)
*   **Wicks/Borders**: Match candle or subtle grey.
*   **Text/Scales**: `#A77590` (Muted pink/grey from app theme)

## 2. Component Structure

### New Component: `ChartToolbar`
Create a new React component to handle the custom controls. The default TradingView toolbar is icon-heavy; the design requires text-based dropdowns.

**Features/Buttons:**
*   **Timeframe**: "1d" (Dropdown or toggle)
*   **Chart Type**: "Candles" (Dropdown)
*   **Indicators**: "Indicators" (Opens TV indicator dialog)
*   **Drawings**: "Lines", "Annotations" (Dropdowns to select drawing tools)
*   **Actions**: "Download" (Snapshot), "Save".

### Modified Component: `TVChartContainer`
Update the existing container to:
1.  Render the `ChartToolbar` above the chart.
2.  Disable the native TradingView header/toolbar to avoid duplication.
3.  Expose the `widget` instance to the toolbar to enable interactions (changing timeframe, adding indicators, etc.).

## 3. Implementation Steps

### Step 1: Update `TVChartContainer` Configuration
Modify `src/components/TradingChart/index.tsx`.

*   **Disable Native Header**: Add `header_widget` to `disabled_features`.
*   **Apply Color Overrides**: Update the `overrides` object in `widgetOptions`.
    ```javascript
    overrides: {
      "paneProperties.background": "#19010E",
      "mainSeriesProperties.candleStyle.upColor": "#00E396",
      "mainSeriesProperties.candleStyle.downColor": "#FF4560",
      "mainSeriesProperties.candleStyle.borderUpColor": "#00E396",
      "mainSeriesProperties.candleStyle.borderDownColor": "#FF4560",
      "mainSeriesProperties.candleStyle.wickUpColor": "#00E396",
      "mainSeriesProperties.candleStyle.wickDownColor": "#FF4560",
      // ... scales and grid styling
    }
    ```

### Step 2: Create `ChartToolbar` Component
Create `src/components/TradingChart/ChartToolbar.tsx`.

*   **Layout**: Flex row with dark background (`#19010E`) and borders (`#563748`).
*   **Props**: Accept `widget` (the TV widget instance) to control the chart.
*   **Functionality**:
    *   `widget.activeChart().setResolution()`
    *   `widget.activeChart().setChartType()`
    *   `widget.chart().executeActionById('insertIndicator')`

### Step 3: Integrate Toolbar & Chart
*   Update `TVChartContainer` to manage the widget state.
*   Render `<ChartToolbar />` at the top of the container.
*   Render the chart div below it, adjusting height calculations (`100% - toolbarHeight`).

## 4. Workflows

### Styling The Custom Toolbar
*   Use CSS Modules or the existing `TradingChart.css`.
*   Ensure the buttons look like the reference: Text with arrow icons, separated by vertical dividers.

### Handling "Lines" and "Annotations"
*   These will need to trigger standard TV drawing tools.
*   *Example*: "Lines" dropdown -> Select "Trend Line" -> Call `widget.chart().createShape(...)` or activate the tool `widget.chart().activeChart().setTool('LineToolTrendLine')`.

## 5. File Changes
*   `src/components/TradingChart/index.tsx`: Main logic update.
*   `src/components/TradingChart/ChartToolbar.tsx`: New file.
*   `src/components/TradingChart/TradingChart.css`: CSS updates.

