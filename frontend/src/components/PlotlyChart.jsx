import Plotly from 'plotly.js-gl3d-dist-min';
import _createPlotlyComponent from 'react-plotly.js/factory';

const createPlotlyComponent = _createPlotlyComponent.default || _createPlotlyComponent;
const Plot = createPlotlyComponent(Plotly);
export default Plot;

