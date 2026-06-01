import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { NearbyPlayer, User, Spot, FeedItem } from '../models/types';
import { useColors } from '../hooks/useColors';

interface LeafletMapProps {
  currentUser: User | null;
  players: NearbyPlayer[];
  spots?: Spot[];
  events?: FeedItem[];
  onMarkerTap: (playerId: string) => void;
  onViewEvent?: (eventId: string) => void; // ADDED
}

export function LeafletMap({ currentUser, players, spots = [], events = [], onMarkerTap, onViewEvent }: LeafletMapProps) {
  const colors = useColors();
  const webviewRef = useRef<WebView>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const mapReadyRef = useRef(false);

  const leafletHtml = useMemo(() => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="${Platform.OS === 'web' ? '/leaflet.min.css' : 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'}" />
      <style>
        body { margin: 0; padding: 0; background-color: ${colors.background}; }
        #map { width: 100vw; height: 100vh; }
        .leaflet-control-attribution { display: none !important; }
        
        .leaflet-popup-content-wrapper, .leaflet-tooltip {
          background-color: rgba(20, 20, 20, 0.85) !important;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: ${colors.foreground || '#ffffff'} !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-radius: 12px !important;
          padding: 6px 4px !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4) !important;
        }
        .leaflet-popup-tip {
          background-color: rgba(20, 20, 20, 0.85) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
        }
        .leaflet-popup-content {
          margin: 12px 14px !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.4 !important;
          font-size: 13px !important;
          color: #ffffff !important; 
        }
        .leaflet-popup-content * {        
          color: #ffffff !important;
        }
        .popup-header {
          font-weight: 700;
          font-size: 15px;
          margin-bottom: 4px;
          letter-spacing: 0.3px;
        }
        .popup-meta {
          font-size: 12px;
          color: ${colors.mutedForeground || '#a0a0a0'};
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 3px;
        }
        
        @keyframes pulse {
          0%   { box-shadow: 0 0 0 0 rgba(63,184,175,0.7); }
          70%  { box-shadow: 0 0 0 16px rgba(63,184,175,0); }
          100% { box-shadow: 0 0 0 0 rgba(63,184,175,0); }
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="${Platform.OS === 'web' ? '/leaflet.min.js' : 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'}"></script>
      <script>
        const map = L.map('map', { zoomControl: false, attributionControl: false })
          .setView([36.8065, 10.1815], 13);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);

        let userMarker = null;
        const playerMarkers = {};
        const spotMarkers = {};
        const eventMarkers = {};

        function updateUser(lat, lng) {
          if (userMarker) {
            userMarker.setLatLng([lat, lng]);
          } else {
            const icon = L.divIcon({
              className: '',
              html: '<div style="width:24px;height:24px;background-color:${colors.primary};border-radius:50%;border:3px solid ${colors.background};animation:pulse 2s infinite;box-sizing:border-box;"></div>',
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            });
            userMarker = L.marker([lat, lng], { icon }).addTo(map);
          }
          map.setView([lat, lng], 14);
        }

        function markerHtml(p) {
          const bg = '${colors.surfaceHigh}';
          const border = '${colors.primary}';
          const baseStyle = 'width:38px;height:38px;border-radius:50%;border:3px solid ' + border + ';overflow:hidden;cursor:pointer;display:flex;align-items:center;justify-content:center;background-color:' + bg + ';color:#fff;font-family:monospace;font-weight:bold;font-size:13px;box-sizing:border-box;';
          if (p.profile_pic && !p.profile_pic.startsWith('avatar')) {
            return '<div style="' + baseStyle + '"><img src="' + p.profile_pic + '" style="width:100%;height:100%;object-fit:cover;" /></div>';
          }
          return '<div style="' + baseStyle + '">' + p.username.substring(0, 2).toUpperCase() + '</div>';
        }

        function updatePlayers(playersStr) {
          const players = JSON.parse(playersStr);
          const seen = new Set();
          players.forEach(p => {
            seen.add(p.id);
            if (!playerMarkers[p.id]) {
              const icon = L.divIcon({ className: '', html: markerHtml(p), iconSize: [38, 38], iconAnchor: [19, 19] });
              const marker = L.marker([p.location.lat, p.location.lng], { icon }).addTo(map);
              marker.on('click', () => {
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'marker', id: p.id }));
                } else {
                  window.parent.postMessage(JSON.stringify({ type: 'marker', id: p.id }), '*');
                }
              });
              playerMarkers[p.id] = marker;
            } else {
              playerMarkers[p.id].setLatLng([p.location.lat, p.location.lng]);
            }
          });
          Object.keys(playerMarkers).forEach(id => {
            if (!seen.has(id)) { map.removeLayer(playerMarkers[id]); delete playerMarkers[id]; }
          });
        }

        function updateSpots(spotsStr) {
          const spots = JSON.parse(spotsStr);
          const seen = new Set();
          const accent = '${colors.accent}';
          const bg = '${colors.background}';
          spots.forEach(s => {
            seen.add(s.id);
            if (!spotMarkers[s.id]) {
              const icon = L.divIcon({
                className: '',
                html: '<div style="width:32px;height:32px;background-color:' + accent + ';border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid ' + bg + ';display:flex;align-items:center;justify-content:center;box-sizing:border-box;cursor:pointer;"><div style="transform:rotate(45deg);color:#000;font-size:14px;font-weight:bold;display:flex;align-items:center;justify-content:center;width:100%;height:100%;">&#9812;</div></div>',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
              });
              const marker = L.marker([s.location.lat, s.location.lng], { icon }).addTo(map);
              
              const popupContent = \`
                <div class="popup-header" style="color:\${accent};">\${s.name}</div>
                <div class="popup-meta">\${s.type || 'Board Game Spot'}</div>
                \${s.address ? \`<div class="popup-meta" style="margin-top:6px;font-size:11px;">📍 \${s.address}</div>\` : ''}
                \${s.description ? \`<div style="margin-top:8px;font-size:12px;opacity:0.9;border-top:1px solid rgb(0, 0, 0);padding-top:6px;">\${s.description}</div>\` : ''}
              \`;
              
              marker.bindPopup(popupContent, { offset: [0, -24], closeButton: false });
              spotMarkers[s.id] = marker;
            }
          });
          Object.keys(spotMarkers).forEach(id => {
            if (!seen.has(id)) { map.removeLayer(spotMarkers[id]); delete spotMarkers[id]; }
          });
        }

        function updateEvents(eventsStr) {
          const events = JSON.parse(eventsStr);
          const seen = new Set();
          const primary = '${colors.primary}';
          const bg = '${colors.background}';
          events.forEach(e => {
            if (!e.location) return;
            seen.add(e.id);
            if (!eventMarkers[e.id]) {
              const icon = L.divIcon({
                className: '',
                html: '<div style="width:32px;height:32px;background-color:' + primary + ';border-radius:50%;border:2px solid ' + bg + ';display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;box-sizing:border-box;">🎫</div>',
                iconSize: [32, 32],
                iconAnchor: [16, 16],
              });
              const marker = L.marker([e.location.lat, e.location.lng], { icon }).addTo(map);
              
              // Added View Event button directly to HTML structure
              const popupContent = \`
                <div class="popup-header" style="color:\${primary};">🎫 \${e.title}</div>
                \${e.date ? \`<div class="popup-meta">📅 \${e.date}</div>\` : ''}
                \${e.spotName ? \`<div class="popup-meta">📍 \${e.spotName}</div>\` : ''}
                \${e.subtitle ? \`<div style="margin-top:8px;font-size:12px;opacity:0.9;border-top:1px solid rgba(255,255,255,0.1);padding-top:6px;">\${e.subtitle}</div>\` : ''}
                <div style="margin-top: 12px; padding: 6px; background-color: \${primary}; color: #000; text-align: center; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;" 
                     onclick="
                       const msg = JSON.stringify({ type: 'view_event', id: '\${e.id}' });
                       if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
                       else window.parent.postMessage(msg, '*');
                     ">
                  View Event
                </div>
              \`;
              
              marker.bindPopup(popupContent, { offset: [0, -8], closeButton: false });
              eventMarkers[e.id] = marker;
            }
          });
          Object.keys(eventMarkers).forEach(id => {
            if (!seen.has(id)) { map.removeLayer(eventMarkers[id]); delete eventMarkers[id]; }
          });
        }

        function handleMsg(event) {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'user') updateUser(data.lat, data.lng);
            if (data.type === 'players') updatePlayers(data.players);
            if (data.type === 'spots') updateSpots(data.spots);
            if (data.type === 'events') updateEvents(data.events);
          } catch(e) {}
        }
        document.addEventListener('message', handleMsg);
        window.addEventListener('message', handleMsg);
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
        } else {
          window.parent.postMessage(JSON.stringify({ type: 'ready' }), '*');
          setTimeout(() => window.parent.postMessage(JSON.stringify({ type: 'ready' }), '*'), 500);
        }
      </script>
    </body>
    </html>
  `, [colors.background, colors.primary, colors.accent, colors.surfaceHigh, colors.foreground, colors.mutedForeground]);

  const pushDataToIframe = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    if (currentUser?.location) {
      win.postMessage(JSON.stringify({ type: 'user', lat: currentUser.location.lat, lng: currentUser.location.lng }), '*');
    }
    win.postMessage(JSON.stringify({ type: 'players', players: JSON.stringify(players) }), '*');
    win.postMessage(JSON.stringify({ type: 'spots', spots: JSON.stringify(spots) }), '*');
    win.postMessage(JSON.stringify({ type: 'events', events: JSON.stringify(events) }), '*');
  }, [currentUser, players, spots, events]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!mapReadyRef.current) return;
    pushDataToIframe();
  }, [pushDataToIframe]);

  const handleIframeMessage = useCallback((ev: MessageEvent) => {
    try {
      const data = JSON.parse(ev.data);
      if (data.type === 'ready') { mapReadyRef.current = true; pushDataToIframe(); }
      if (data.type === 'marker') onMarkerTap(data.id);
      if (data.type === 'view_event' && onViewEvent) onViewEvent(data.id); // ADDED
    } catch {}
  }, [pushDataToIframe, onMarkerTap, onViewEvent]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, [handleIframeMessage]);

  const handleIframeLoad = useCallback((_e: React.SyntheticEvent<HTMLIFrameElement>) => {
    mapReadyRef.current = false;
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' || !webviewRef.current || !currentUser) return;
    webviewRef.current.injectJavaScript(`
      updateUser(${currentUser.location.lat}, ${currentUser.location.lng});
      updatePlayers(${JSON.stringify(JSON.stringify(players))});
      updateSpots(${JSON.stringify(JSON.stringify(spots))});
      updateEvents(${JSON.stringify(JSON.stringify(events))});
      true;
    `);
  }, [currentUser?.location, players, spots, events]);

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <iframe
          ref={iframeRef}
          srcDoc={leafletHtml}
          style={{ width: '100%', height: '100%', border: 'none' } as React.CSSProperties}
          onLoad={handleIframeLoad as any}
        />
      ) : (
        <WebView
          ref={webviewRef}
          source={{ html: leafletHtml }}
          style={{ flex: 1, backgroundColor: colors.background }}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'marker') onMarkerTap(data.id);
              if (data.type === 'view_event' && onViewEvent) onViewEvent(data.id); // ADDED
            } catch {}
          }}
          scrollEnabled={false}
          bounces={false}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });