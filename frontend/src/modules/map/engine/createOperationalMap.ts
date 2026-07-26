import Feature from "ol/Feature";
import Map from "ol/Map";
import View from "ol/View";
import Circle from "ol/geom/Circle";
import LineString from "ol/geom/LineString";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import { fromLonLat } from "ol/proj";
import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";
import { Fill, Icon, Stroke, Style, Text } from "ol/style";

const blue = "#3da9fc";
const red = "#ff5a67";
const amber = "#f4b942";

function unitStyle(color: string, label: string) {
  return new Style({
    image: new Icon({
      src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="46" height="32"><rect x="1" y="1" width="44" height="30" rx="3" fill="#07131a" stroke="${color}" stroke-width="2"/><path d="M8 23 L17 10 L25 20 L31 13 L38 23" fill="none" stroke="${color}" stroke-width="2"/><circle cx="17" cy="9" r="2" fill="${color}"/></svg>`)}`,
      anchor: [0.5, 0.5],
    }),
    text: new Text({ text: label, offsetY: 25, fill: new Fill({ color: "#eaf4f8" }), stroke: new Stroke({ color: "#07131a", width: 4 }), font: "600 11px Inter, sans-serif" }),
  });
}

export type OperationalMapBundle = {
  map: Map;
  layers: Record<string, TileLayer<OSM> | VectorLayer<VectorSource>>;
};

export function createOperationalMap(target: HTMLElement): OperationalMapBundle {
  const base = new TileLayer({ source: new OSM(), opacity: 0.55 });
  base.set("layerId", "basemap");

  const blueSource = new VectorSource({
    features: [
      new Feature({ geometry: new Point(fromLonLat([32.32, 30.18])) }),
      new Feature({ geometry: new Point(fromLonLat([32.49, 30.08])) }),
      new Feature({ geometry: new Point(fromLonLat([32.61, 30.23])) }),
    ],
  });
  const blueLayer = new VectorLayer({ source: blueSource, style: (_f, r) => unitStyle(blue, r < 5 ? "BLUE TASK FORCE" : "BDE") });
  blueLayer.set("layerId", "blue-units");

  const redSource = new VectorSource({
    features: [
      new Feature({ geometry: new Point(fromLonLat([32.84, 30.15])) }),
      new Feature({ geometry: new Point(fromLonLat([32.75, 29.99])) }),
    ],
  });
  const redLayer = new VectorLayer({ source: redSource, style: unitStyle(red, "RED BDE") });
  redLayer.set("layerId", "red-units");

    const routeCoordinates: [number, number][] = [
    [32.2, 30.3],
    [32.45, 30.19],
    [32.68, 30.28],
    [32.92, 30.16],
  ];

  const areaCoordinates: [number, number][] = [
    [32.35, 29.91],
    [32.61, 29.91],
    [32.65, 30.05],
    [32.39, 30.08],
    [32.35, 29.91],
  ];

  const controlSource = new VectorSource({
    features: [
      new Feature({
        geometry: new LineString(
          routeCoordinates.map((coordinate) => fromLonLat(coordinate)),
        ),
      }),

      new Feature({
        geometry: new Polygon([
          areaCoordinates.map((coordinate) => fromLonLat(coordinate)),
        ]),
      }),

      new Feature({
        geometry: new Circle(fromLonLat([32.58, 30.12]), 9000),
      }),
    ],
  });
  const controlLayer = new VectorLayer({ source: controlSource, style: (feature) => {
    const geometry = feature.getGeometry();
    if (geometry instanceof LineString) return new Style({ stroke: new Stroke({ color: amber, width: 3, lineDash: [12, 8] }) });
    return new Style({ stroke: new Stroke({ color: amber, width: 2 }), fill: new Fill({ color: "rgba(244,185,66,0.08)" }) });
  }});
  controlLayer.set("layerId", "control-measures");

  const drawingSource = new VectorSource();
  const drawingLayer = new VectorLayer({ source: drawingSource, style: new Style({ stroke: new Stroke({ color: "#8ce99a", width: 3 }), fill: new Fill({ color: "rgba(140,233,154,0.12)" }), image: new Icon({ src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="6" fill="#8ce99a" stroke="#07131a" stroke-width="2"/></svg>')}` }) }) });
  drawingLayer.set("layerId", "user-graphics");

  const map = new Map({
    target,
    layers: [base, controlLayer, blueLayer, redLayer, drawingLayer],
    view: new View({ center: fromLonLat([32.55, 30.12]), zoom: 10, minZoom: 3, maxZoom: 19 }),
    controls: [],
  });

  return { map, layers: { basemap: base, "blue-units": blueLayer, "red-units": redLayer, "control-measures": controlLayer, "user-graphics": drawingLayer } };
}

