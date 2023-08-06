import Map from 'ol/Map';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import { Feature } from 'ol';
import { Point, Polygon } from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import { Fill, Icon, Stroke, Style } from 'ol/style';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

// import DroneImage from 'public/icons/drone.png';
import { Coordinate } from 'ol/coordinate';
import CircleStyle from 'ol/style/Circle';
import {Draw, Modify, Snap} from 'ol/interaction';
import {get as getProj} from 'ol/proj.js';


//  Заготовка под grpc
interface PointLatLon {
  latutude: number;
  longitude: number;
}

class OpenLayersCanvas {
	private radian = 57.295;

	private mapObjects: any = {};
	private map: Map;

	private objectsLayer = new VectorLayer({});
	private objectsLayerSource = new VectorSource({});

	private detectedLayer = new VectorLayer({});
	private detectedLayerSource = new VectorSource({});

	private drawVectorSource = new VectorSource({});
	private drawVector = new VectorLayer({
		source: this.drawVectorSource,
		style: {
			'fill-color': 'rgba(255, 255, 255, 0.2)',
			'stroke-color': '#ffcc33',
			'stroke-width': 2,
			'circle-radius': 7,
			'circle-fill-color': '#ffcc33',
		},
	});

	private  modify = new Modify({source: this.drawVectorSource});

	private draw = new Draw({
		source: this.drawVectorSource,
		type: 'LineString',
	});

	private snap = new Snap({source: this.drawVectorSource});

	private styles: any = {
		drone: new Style({
			image: new CircleStyle({
				radius: 5,
				fill: new Fill({color: 'yellow'}),
				stroke: new Stroke({color: 'red', width: 1}),
			}),
		}),
		bluePolygon: new Style({
			stroke: new Stroke({
				color: 'blue',
				lineDash: [4],
				width: 3,
			}),
			fill: new Fill({
				color: 'rgba(0, 0, 255)',
			}),
		}),
	};

	constructor() {
		
		const proj = getProj('EPSG:3857');
		if (proj !== null){
			const extent = proj.getExtent().slice();
			extent[0] += extent[0];
			extent[2] += extent[2];

			this.map = new Map({
				layers: [
					new TileLayer({
						source: new OSM(),
					}),
				],
				target: 'map',
				view: new View({
					center: [-11000000, 4600000],
					zoom: 4,
					extent,
				}),
			});
		}else {
			this.map = new Map({
				layers: [
					new TileLayer({
						source: new OSM(),
					}),
				],
				target: 'map',
				view: new View({
					center: [0, 0],
					zoom: 4,
				}),
			});
		}

		this.objectsLayer.setSource(this.objectsLayerSource);
		this.objectsLayer.setStyle((feature) => this.styles[feature.get('type')]);
		this.detectedLayer.setSource(this.detectedLayerSource);
		this.detectedLayer.setStyle((feature) => this.styles[feature.get('type')]);

		this.map.addLayer(this.detectedLayer);
		this.map.addLayer(this.objectsLayer);
		this.map.addLayer(this.drawVector);



		this.createObjectInObjectsLayer('Jet', 'drone');
		// let mlat = 30;
		// let mlon = 30;

		this.createObjectInDetectedLayer('polygon', [
			{ latutude: 30, longitude: 30 },
			{ latutude: 35, longitude: 30 },
			{ latutude: 30, longitude: 35 },
		]);

		// setInterval(() => {
		// 	mlat += Math.random() / 1000;
		// 	mlon += Math.random() / 1000;

		// 	const rotate = this.map.getView().getRotation() * this.radian;

		// 	this.moveFeature('Jet', mlat, mlon);
		// 	this.moveCenter(mlat, mlon);
		// 	this.rotateView(rotate + 0.5);
		// }, 17);

		this.map.addInteraction(this.modify);
		this.addInteractions();
	}

	private addInteractions(): void {
		this.draw = new Draw({
			source: this.drawVectorSource,
			type: 'LineString',
		});
		this.map.addInteraction(this.draw);
		this.map.addInteraction(this.snap);
	}

	private createObjectInObjectsLayer(featureId: string, type: string): void {
		const newFeature = new Feature({
			type: type,
			geometry: new Point([0, 0]),
		});

		this.mapObjects[featureId] = newFeature;

		this.objectsLayerSource.addFeature(newFeature);
	}

	private createObjectInDetectedLayer(featureId: string, geometry: PointLatLon[]): void {
		const featureGeometry: Coordinate[] = [];
		geometry.map((point) => {
			featureGeometry.push(fromLonLat([point.latutude, point.longitude]));
		});

		const newFeature = new Feature({
			type: 'bluePolygon',
			geometry: new Polygon([featureGeometry]),
		});

		this.mapObjects[featureId] = newFeature;

		this.detectedLayerSource.addFeature(newFeature);
	}

	private moveFeature(featureId: string, lat: number, lon: number): void {
		if (this.mapObjects[featureId] === undefined) return;
		this.mapObjects[featureId].getGeometry().setCoordinates(fromLonLat([lat, lon]));
	}

	private moveCenter(lat: number, lon: number): void {
		this.map.getView().setCenter(fromLonLat([lat, lon]));
	}

	private rotateView(angle: number): void {
		this.map.getView().setRotation(angle / this.radian);
	}
}

export default OpenLayersCanvas;
