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
import {Control, defaults as defaultControls} from 'ol/control';

//  Заготовка под grpc
interface PointLatLon {
  latutude: number;
  longitude: number;
}

class RotateNorthControl extends Control {
	/**
	 * @param {Object} [opt_options] Control options.
	 */
	constructor(opt_options: any) {
		const options = opt_options || {};
  
		const button = document.createElement('button');
		button.innerHTML = 'Draw';
		button.setAttribute(
			'style', 
			'width: 60px; height: 30px; position: fixed; margin-left: 50%'
		);
		const element = document.createElement('div');
		element.className = 'rotate-north ol-unselectable ol-control';
		element.appendChild(button);

		super({
			element: element,
			target: options.target,
		});
  
		button.addEventListener('click', this.handleRotateNorth.bind(this), false);
	}
  
	handleRotateNorth(): void {
		console.log('AA!');
		const map = this.getMap();
		if (map !== null){
			map.getView().setRotation(0);
		}		
	}
}

class OpenLayersCanvas {
	private radian = 57.295;

	private mapObjects: any = {};
	private map: Map;

	private objectsLayer = new VectorLayer({});
	private objectsLayerSource = new VectorSource({});

	private detectedLayer = new VectorLayer({});
	private detectedLayerSource = new VectorSource({});

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
		this.map = new Map({
			// controls: defaultControls().extend([new RotateNorthControl(this)]),
			layers: [
				new TileLayer({
					source: new OSM(),
				}),
			],
			target: 'map',
			view: new View({
				center: [0, 0],
				zoom: 3,
			}),
		});

		this.objectsLayer.setSource(this.objectsLayerSource);
		this.objectsLayer.setStyle((feature) => this.styles[feature.get('type')]);
		this.detectedLayer.setSource(this.detectedLayerSource);
		this.detectedLayer.setStyle((feature) => this.styles[feature.get('type')]);

		this.map.addLayer(this.detectedLayer);
		this.map.addLayer(this.objectsLayer);

		this.createObjectInObjectsLayer('Jet', 'drone');
		// let mlat = 30;
		// let mlon = 30;

		// this.createObjectIndetectedLayer('polygon', [
		// 	{ latutude: 30, longitude: 30 },
		// 	{ latutude: 35, longitude: 30 },
		// 	{ latutude: 30, longitude: 35 },
		// ]);

		// setInterval(() => {
		// 	mlat += Math.random() / 1000;
		// 	mlon += Math.random() / 1000;

		// 	const rotate = this.map.getView().getRotation() * this.radian;

		// 	this.moveFeature('Jet', mlat, mlon);
		// 	this.moveCenter(mlat, mlon);
		// 	this.rotateView(rotate + 0.5);
		// }, 17);
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
