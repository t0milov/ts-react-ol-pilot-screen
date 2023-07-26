import React, { useEffect, useRef } from 'react';
import OpenLayersCanvas from './olMap';
import 'ol/ol.css';
import styles from './MapComponent.module.css';

export const MapComponent: React.FC = () => {
	const olCanvas = useRef<any>(null);

	useEffect(() => {
		if (olCanvas.current === null) olCanvas.current = new OpenLayersCanvas();
	}, []);

	return (
		<div id="map" className={`${styles['map']}`}/>
	);
};