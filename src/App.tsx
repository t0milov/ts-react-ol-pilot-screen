import React, { useContext, useEffect, useRef } from 'react';
import './App.css';
import 'ol/ol.css';
import Map from 'ol/Map.js';
import OSM from 'ol/source/OSM.js';
import TileLayer from 'ol/layer/Tile.js';
import View from 'ol/View.js';
import { MapComponent } from './olMap/MapComponent';

const App: React.FC = () => {

	// const olCanvasRef = useRef<any>(null);

	// useEffect(() => {
	// 	if (olCanvasRef.current === null){
	// 		try{
	// 			olCanvasRef.current = new Map({
	// 				target: 'map',
	// 				layers: [
	// 					new TileLayer({
	// 						source: new OSM(),
	// 					}),
	// 				],
	// 				view: new View({
	// 					center: [0, 0],
	// 					zoom: 2,
	// 				}),
	// 			});
	// 		}catch(e){
	// 			console.log(e);
	// 		}
	// 	}
	// }, []);

	return (
		// <div style={{
		// 	width: '100vw', 
		// 	height: '100vh', 
		// }} id="map"/>
		<MapComponent/>
	);
};

export default App;
