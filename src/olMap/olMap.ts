import Map from 'ol/Map';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import { Feature } from 'ol';
import { Point, Polygon, LineString } from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import { Fill, Icon, RegularShape, Stroke, Style, Text } from 'ol/style';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

// import DroneImage from 'public/icons/drone.png';
import { Coordinate } from 'ol/coordinate';
import CircleStyle from 'ol/style/Circle';
import {Draw, Modify, Snap} from 'ol/interaction';
import {get as getProj} from 'ol/proj.js';

import {getArea, getLength} from 'ol/sphere.js';


//  Заготовка под grpc
interface PointLatLon {
  latutude: number;
  longitude: number;
}

class OpenLayersCanvas {

	private style = new Style({
		fill: new Fill({
			color: 'rgba(255, 255, 255, 0.2)',
		}),
		stroke: new Stroke({
			color: 'rgba(0, 0, 0, 0.5)',
			lineDash: [10, 10],
			width: 2,
		}),
		image: new CircleStyle({
			radius: 5,
			stroke: new Stroke({
				color: 'rgba(0, 0, 0, 0.7)',
			}),
			fill: new Fill({
				color: 'rgba(255, 255, 255, 0.2)',
			}),
		}),
	});

	private segmentStyle = new Style({
		text: new Text({
			font: '12px Calibri,sans-serif',
			fill: new Fill({
				color: 'rgba(255, 255, 255, 1)',
			}),
			backgroundFill: new Fill({
				color: 'rgba(0, 0, 0, 0.4)',
			}),
			padding: [2, 2, 2, 2],
			textBaseline: 'bottom',
			offsetY: -12,
		}),
		image: new RegularShape({
			radius: 6,
			points: 3,
			angle: Math.PI,
			displacement: [0, 8],
			fill: new Fill({
				color: 'rgba(0, 0, 0, 0.4)',
			}),
		}),
	});

	private labelStyle = new Style({
		text: new Text({
			font: '14px Calibri,sans-serif',
			fill: new Fill({
				color: 'rgba(255, 255, 255, 1)',
			}),
			backgroundFill: new Fill({
				color: 'rgba(0, 0, 0, 0.7)',
			}),
			padding: [3, 3, 3, 3],
			textBaseline: 'bottom',
			offsetY: -15,
		}),
		image: new RegularShape({
			radius: 8,
			points: 3,
			angle: Math.PI,
			displacement: [0, 10],
			fill: new Fill({
				color: 'rgba(0, 0, 0, 0.7)',
			}),
		}),
	});

	private tipStyle = new Style({
		text: new Text({
			font: '12px Calibri,sans-serif',
			fill: new Fill({
				color: 'rgba(255, 255, 255, 1)',
			}),
			backgroundFill: new Fill({
				color: 'rgba(0, 0, 0, 0.4)',
			}),
			padding: [2, 2, 2, 2],
			textAlign: 'left',
			offsetX: 15,
		}),
	});

	private segmentStyles = [this.segmentStyle];

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

	private tipPoint: any = {};

	constructor() {
		
		// const segmentStyle = new Style({
		// 	text: new Text({
		// 		font: '12px Calibri,sans-serif',
		// 		fill: new Fill({
		// 			color: 'rgba(255, 255, 255, 1)',
		// 		}),
		// 		backgroundFill: new Fill({
		// 			color: 'rgba(0, 0, 0, 0.4)',
		// 		}),
		// 		padding: [2, 2, 2, 2],
		// 		textBaseline: 'bottom',
		// 		offsetY: -12,
		// 	}),
		// 	image: new RegularShape({
		// 		radius: 6,
		// 		points: 3,
		// 		angle: Math.PI,
		// 		displacement: [0, 8],
		// 		fill: new Fill({
		// 			color: 'rgba(0, 0, 0, 0.4)',
		// 		}),
		// 	}),
		// });
  
		// const segmentStyles = [segmentStyle];

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


		const edges = new VectorSource({wrapX: false});
		const edgesLayer = new VectorLayer({
			source: edges,
			style: function (f) {
				const style = new Style({
					stroke: new Stroke({
						color: 'blue',
						width: 1,
					}),
					text: new Text({
						text: f.get('edge').id.toString(),
						fill: new Fill({color: 'blue'}),
						stroke: new Stroke({
							color: 'white',
							width: 2,
						}),
					}),
				});
				return [style];
			},
		});

		// this.map.addLayer(edgesLayer);

		const snap = new Snap({
			source: edges,
		});
		this.map.addInteraction(snap);

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

	private formatLength(line: any): any {
		const length = getLength(line);
		let output;
		if (length > 100) {
			output = Math.round((length / 1000) * 100) / 100 + ' km';
		} else {
			output = Math.round(length * 100) / 100 + ' m';
		}
		return output;
	}
	
	private formatArea(polygon: any): any {
		const area = getArea(polygon);
		let output;
		if (area > 10000) {
			output = Math.round((area / 1000000) * 100) / 100 + ' km\xB2';
		} else {
			output = Math.round(area * 100) / 100 + ' m\xB2';
		}
		return output;
	}

	private styleFunction(feature: any, segments: any, drawType: any, tip: any): any {
		const styles = [this.style];
		const geometry = feature.getGeometry();
		const type = geometry.getType();
		let point, label, line;
		if (!drawType || drawType === type) {
			if (type === 'Polygon') {
				point = geometry.getInteriorPoint();
				label = this.formatArea(geometry);
				line = new LineString(geometry.getCoordinates()[0]);
			} else if (type === 'LineString') {
				point = new Point(geometry.getLastCoordinate());
				label = this.formatLength(geometry);
				line = geometry;
			}
		}
		if (segments && line) {
			let count = 0;
			line.forEachSegment((a: any, b: any) => {
				const segment = new LineString([a, b]);
				const label = this.formatLength(segment);
				if (this.segmentStyles.length - 1 < count) {
					this.segmentStyles.push(this.segmentStyle.clone());
				}
				const segmentPoint = new Point(segment.getCoordinateAt(0.5));
				this.segmentStyles[count].setGeometry(segmentPoint);
				this.segmentStyles[count].getText().setText(label);
				styles.push(this.segmentStyles[count]);
				count++;
			});
		}
		if (label) {
			this.labelStyle.setGeometry(point);
			this.labelStyle.getText().setText(label);
			styles.push(this.labelStyle);
		}
		if (
			tip &&
			type === 'Point' &&
			!this.modify.getOverlay().getSource().getFeatures().length
		) {
			this.tipPoint = geometry;
			this.tipStyle.getText().setText(tip);
			styles.push(this.tipStyle);
		}
		return styles;
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
