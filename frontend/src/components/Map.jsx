import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY

function Map({ onIssueClick, issues = [], showHeatmap = true, showMarkers = true, selectedCity = null }) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (map.current) return

    mapboxgl.accessToken = 'no-token'

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/darkmatter/style.json?key=${MAPTILER_KEY}`,
      center: [76.6394, 12.3375],
      zoom: 13,
      pitch: 45,
      bearing: 0,
      antialias: true,
    })

if (window.innerWidth > 1024) {
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
      }
      map.current.addControl(new mapboxgl.FullscreenControl(), 'bottom-right')

    map.current.on('load', () => {
      initialized.current = true
      addLayers()
    })

  }, [])

  // Update data when issues change
  useEffect(() => {
    if (!initialized.current || !map.current) return
    const source = map.current.getSource('issues')
    if (source) {
      source.setData(buildGeojson(issues))
    }
  }, [issues])

  // Toggle heatmap visibility
  useEffect(() => {
    if (!initialized.current || !map.current) return
    if (map.current.getLayer('issues-heatmap')) {
      map.current.setLayoutProperty(
        'issues-heatmap',
        'visibility',
        showHeatmap ? 'visible' : 'none'
      )
    }
  }, [showHeatmap])

  // Toggle markers visibility
  useEffect(() => {
    if (!initialized.current || !map.current) return
    const layers = ['clusters', 'cluster-count', 'unclustered-point']
    layers.forEach(layer => {
      if (map.current.getLayer(layer)) {
        map.current.setLayoutProperty(
          layer,
          'visibility',
          showMarkers ? 'visible' : 'none'
        )
      }
    })
  }, [showMarkers])

  // Handle city selection and fly to
  useEffect(() => {
    if (!initialized.current || !map.current || !selectedCity) return
    map.current.flyTo({
      center: [selectedCity.lng, selectedCity.lat],
      zoom: 13,
      duration: 2000
    })
  }, [selectedCity])

  const buildGeojson = (issuesList) => ({
    type: 'FeatureCollection',
    features: issuesList.map(issue => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [issue.lng, issue.lat]
      },
      properties: {
        id: issue.id,
        report_count: issue.report_count,
        type: issue.type,
        severity: issue.severity,
        status: issue.status,
        ward: issue.ward,
        authority: issue.authority,
        created_at: issue.created_at,
        image_urls: JSON.stringify(issue.image_urls || []),
        days: Math.floor(
          (Date.now() - new Date(issue.created_at)) / 86400000
        )
      }
    }))
  })

  const addLayers = () => {
    map.current.addSource('issues', {
      type: 'geojson',
      data: buildGeojson(issues),
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    })

    // Heatmap layer
    map.current.addLayer({
      id: 'issues-heatmap',
      type: 'heatmap',
      source: 'issues',
      maxzoom: 12,
      paint: {
        'heatmap-weight': ['interpolate', ['linear'],
          ['get', 'report_count'], 0, 0, 50, 1],
        'heatmap-intensity': 1.5,
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(0,0,0,0)',
          0.2, '#eab308',
          0.5, '#f97316',
          0.8, '#ef4444',
          1, '#7f1d1d'
        ],
        'heatmap-radius': 40,
        'heatmap-opacity': 0.8,
      }
    })

    // Cluster circles
    map.current.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'issues',
      filter: ['has', 'point_count'],
      minzoom: 12,
      paint: {
        'circle-color': [
          'step', ['get', 'point_count'],
          '#eab308', 5,
          '#f97316', 20,
          '#ef4444'
        ],
        'circle-radius': [
          'step', ['get', 'point_count'],
          20, 5, 30, 20, 40
        ],
        'circle-opacity': 0.85,
      }
    })

    // Cluster count labels
    map.current.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'issues',
      filter: ['has', 'point_count'],
      minzoom: 12,
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-size': 13,
        'text-font': ['Open Sans Bold'],
      },
      paint: { 'text-color': '#ffffff' }
    })

    // Individual dots
    map.current.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'issues',
      filter: ['!', ['has', 'point_count']],
      minzoom: 14,
      paint: {
        'circle-color': [
          'step', ['get', 'report_count'],
          '#eab308', 12,
          '#f97316', 30,
          '#ef4444'
        ],
        'circle-radius': 10,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
        'circle-opacity': 0.9,
      }
    })

    // Click individual dot
    map.current.on('click', 'unclustered-point', (e) => {
      const props = e.features[0].properties
      const coords = e.features[0].geometry.coordinates
      const imageUrls = JSON.parse(props.image_urls || '[]')
      onIssueClick({
        ...props,
        image_urls: imageUrls,
        lat: coords[1],
        lng: coords[0]
      })
    })

    // Cursor pointer
    map.current.on('mouseenter', 'unclustered-point', () => {
      map.current.getCanvas().style.cursor = 'pointer'
    })
    map.current.on('mouseleave', 'unclustered-point', () => {
      map.current.getCanvas().style.cursor = ''
    })
  }

  return (
    <div
      ref={mapContainer}
      className="absolute inset-0 w-full h-full"
    />
  )
}

export default Map