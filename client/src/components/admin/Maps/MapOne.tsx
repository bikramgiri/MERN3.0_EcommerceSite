import 'jsvectormap/dist/css/jsvectormap.min.css';
import { useEffect } from 'react';
import jsVectorMap from 'jsvectormap';
import "../../../js/us-aea-en"
const MapOne = () => {
  useEffect(() => {
    const mapOne = new jsVectorMap({
      selector: '#mapOne',
      map: 'us_aea_en',
      zoomButtons: true,

      regionStyle: {
        initial: {
          fill: '#C8D0D8',
        },
        hover: {
          fillOpacity: 1,
          fill: '#3056D3',
        },
      },
      regionLabelStyle: {
        initial: {
          fontFamily: 'Satoshi',
          fontWeight: 'semibold',
          fill: '#fff',
        },
        hover: {
          cursor: 'pointer',
        },
      },

      labels: {
        regions: {
          render(code: string) {
            return code.split('-')[1];
          },
        },
      },
    });
    mapOne;
  });

  return (
    <div className="col-span-12 rounded-sm border border-gray-300 bg-white py-6 px-7.5 shadow-md xl:col-span-7">
      <h4 className="mb-2 text-xl font-semibold text-black dark:text-white">
        Region labels
      </h4>
      <div id="mapOne" className="mapOne map-btn h-90"></div>
    </div>
  );
};

export default MapOne;
