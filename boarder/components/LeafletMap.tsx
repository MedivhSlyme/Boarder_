import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { NearbyPlayer, User, BoardGameSpot } from '../models/types';
import { useColors } from '../hooks/useColors';

interface LeafletMapProps {
  currentUser: User | null;
  players: NearbyPlayer[];
  spots?: BoardGameSpot[];
  onMarkerTap: (playerId: string) => void;
  onSpotTap?: (spot: BoardGameSpot) => void;
}

function buildHtml(colors: any, lat: number, lng: number): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
* { box-sizing: border-box; }
body { margin: 0; padding: 0; background: ${colors.background}; }
#map { width: 100vw; height: 100vh; }
.leaflet-control-attribution { display: none !important; }
.leaflet-popup-content-wrapper {
  background: ${colors.card};
  border: 1px solid ${colors.border};
  border-radius: 12px;
  color: ${colors.foreground};
  box-shadow: 0 4px 24px rgba(0,0,0,0.4);
}
.leaflet-popup-tip { background: ${colors.card}; }
.leaflet-popup-close-button { color: ${colors.mutedForeground} !important; }
.user-marker {
  width: 28px;
  height: 28px;
  background: ${colors.primary};
  border-radius: 50%;
  border: 3px solid ${colors.background};
  box-shadow: 0 0 0 0 rgba(63,184,175,0.7);
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%   { box-shadow: 0 0 0 0 rgba(63,184,175,0.7); }
  70%  { box-shadow: 0 0 0 16px rgba(63,184,175,0); }
  100% { box-shadow: 0 0 0 0 rgba(63,184,175,0); }
}
.player-marker {
  border-radius: 50%;
  border: 3px solid ${colors.primary};
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${colors.surfaceHigh};
  color: #fff;
  font-family: monospace;
  font-weight: bold;
  font-size: 13px;
  transition: transform 0.15s;
}
.player-marker:hover { transform: scale(1.1); }
.player-marker img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.spot-marker {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid ${colors.accent};
  background: ${colors.card};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  transition: transform 0.15s;
}
.spot-marker:hover { transform: scale(1.1); }
.popup-title { font-weight: bold; font-size: 14px; margin-bottom: 4px; color: ${colors.foreground}; }
.popup-cat { font-size: 11px; color: ${colors.accent}; letter-spacing: 1px; margin-bottom: 6px; text-transform: uppercase; }
.popup-desc { font-size: 13px; color: ${colors.mutedForeground}; line-height: 1.4; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
function sendMsg(data) {
  var msg = JSON.stringify(data);
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(msg);
  } else {
    window.parent.postMessage(msg, '*');
  }
}

var leafletMap = L.map('map', { zoomControl: true, attributionControl: false })
  .setView([${lat}, ${lng}], 14);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(leafletMap);

var userMarker = null;
var playerMarkers = {};
var spotMarkers = {};

function updateUser(lat, lng) {
  if (userMarker) {
    userMarker.setLatLng([lat, lng]);
  } else {
    var icon = L.divIcon({
      className: '',
      html: '<div class="user-marker"></div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    userMarker = L.marker([lat, lng], { icon: icon, zIndexOffset: 1000 }).addTo(leafletMap);
    userMarker.bindTooltip('You', { permanent: false, direction: 'top' });
  }
  leafletMap.setView([lat, lng]);
}

function playerHtml(p) {
  var initials = p.username.substring(0, 2).toUpperCase();
  if (p.profile_pic && p.profile_pic.indexOf('http') === 0) {
    return '<div class="player-marker" style="width:38px;height:38px;">'
      + '<img src="' + p.profile_pic + '" alt="' + initials + '" '
      + 'onerror="this.remove()" />'
      + '<span style="position:absolute">' + initials + '</span>'
      + '</div>';
  }
  return '<div class="player-marker" style="width:38px;height:38px;">' + initials + '</div>';
}

function updatePlayers(players) {
  var seen = {};
  players.forEach(function(p) {
    seen[p.id] = true;
    if (!playerMarkers[p.id]) {
      var icon = L.divIcon({
        className: '',
        html: playerHtml(p),
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });
      var marker = L.marker([p.location.lat, p.location.lng], { icon: icon }).addTo(leafletMap);
      marker.bindTooltip(p.username, { direction: 'top', offset: [0, -22] });
      (function(pid) {
        marker.on('click', function() { sendMsg({ type: 'marker', id: pid }); });
      })(p.id);
      playerMarkers[p.id] = marker;
    } else {
      playerMarkers[p.id].setLatLng([p.location.lat, p.location.lng]);
    }
  });
  Object.keys(playerMarkers).forEach(function(id) {
    if (!seen[id]) {
      leafletMap.removeLayer(playerMarkers[id]);
      delete playerMarkers[id];
    }
  });
}

function getCategoryEmoji(category) {
  if (category === 'Chess Cafe') return '\u265F\uFE0F';
  if (category === 'Library') return '\uD83D\uDCDA';
  if (category === 'Gaming Club') return '\uD83C\uDFB2';
  if (category === 'Board Game Store') return '\uD83C\uDFEA';
  if (category === 'Bar / Pub') return '\uD83C\uDF7A';
  if (category === 'Community Center') return '\uD83C\uDFDB\uFE0F';
  return '\uD83D\uDCCD';
}

function updateSpots(spots) {
  var seen = {};
  spots.forEach(function(s) {
    seen[s.id] = true;
    if (!spotMarkers[s.id]) {
      var emoji = getCategoryEmoji(s.category);
      var html = '<div class="spot-marker">' + emoji + '</div>';
      var icon = L.divIcon({
        className: '',
        html: html,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      var marker = L.marker([s.location.lat, s.location.lng], { icon: icon, zIndexOffset: 500 }).addTo(leafletMap);
      var popupContent = '<div class="popup-title">' + s.name + '</div>'
        + '<div class="popup-cat">' + s.category + '</div>'
        + (s.description ? '<div class="popup-desc">' + s.description + '</div>' : '');
      marker.bindPopup(popupContent, { maxWidth: 220 });
      (function(sid) {
        marker.on('click', function() { sendMsg({ type: 'spot', id: sid }); });
      })(s.id);
      spotMarkers[s.id] = marker;
    }
  });
  Object.keys(spotMarkers).forEach(function(id) {
    if (!seen[id]) {
      leafletMap.removeLayer(spotMarkers[id]);
      delete spotMarkers[id];
    }
  });
}

function handleMsg(event) {
  try {
    var data = JSON.parse(event.data);
    if (data.type === 'user') updateUser(data.lat, data.lng);
    if (data.type === 'players') updatePlayers(data.players);
    if (data.type === 'spots') updateSpots(data.spots);
  } catch(e) {}
}

document.addEventListener('message', handleMsg);
window.addEventListener('message', handleMsg);
</script>
</body>
</html>`;
}

export function LeafletMap({ currentUser, players, spots = [], onMarkerTap, onSpotTap }: LeafletMapProps) {
  const colors = useColors();
  const webviewRef = useRef<WebView>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const messageHandlerRef = useRef<((ev: MessageEvent) => void) | null>(null);

  const lat = currentUser?.location.lat ?? 48.8566;
  const lng = currentUser?.location.lng ?? 2.3522;

  // Build a blob URL on web — avoids all sandbox/srcDoc parsing quirks
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const html = buildHtml(colors, lat, lng);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  // Only rebuild when the map center changes (colors are static)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  const leafletHtmlForWebView = buildHtml(colors, lat, lng);

  const postToIframe = (data: object) => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify(data), '*');
  };

  const postToWebView = (data: object) => {
    const msg = JSON.stringify(data);
    webviewRef.current?.injectJavaScript(
      `(function(){ try { handleMsg({ data: ${JSON.stringify(msg)} }); } catch(e){} })(); true;`
    );
  };

  const sendToMap = (data: object) => {
    if (Platform.OS === 'web') {
      postToIframe(data);
    } else {
      postToWebView(data);
    }
  };

  // Send updates whenever data changes
  useEffect(() => {
    if (currentUser) {
      sendToMap({ type: 'user', lat: currentUser.location.lat, lng: currentUser.location.lng });
    }
  }, [currentUser?.location.lat, currentUser?.location.lng]);

  useEffect(() => {
    sendToMap({ type: 'players', players });
  }, [players]);

  useEffect(() => {
    sendToMap({ type: 'spots', spots });
  }, [spots]);

  const handleMessage = (raw: string) => {
    try {
      const data = JSON.parse(raw);
      if (data.type === 'marker') onMarkerTap(data.id);
      if (data.type === 'spot' && onSpotTap) {
        const spot = spots.find((s) => s.id === data.id);
        if (spot) onSpotTap(spot);
      }
    } catch {}
  };

  const onIframeLoad = () => {
    // Remove old listener before attaching a new one
    if (messageHandlerRef.current) {
      window.removeEventListener('message', messageHandlerRef.current);
    }
    const handler = (ev: MessageEvent) => {
      if (ev.source === iframeRef.current?.contentWindow) {
        handleMessage(ev.data);
      }
    };
    messageHandlerRef.current = handler;
    window.addEventListener('message', handler);

    // Send initial data after the map script has loaded (slight delay for Leaflet CDN)
    const send = (delay: number) =>
      setTimeout(() => {
        if (currentUser) {
          postToIframe({ type: 'user', lat: currentUser.location.lat, lng: currentUser.location.lng });
        }
        postToIframe({ type: 'players', players });
        postToIframe({ type: 'spots', spots });
      }, delay);

    send(400);
    send(1200); // retry in case Leaflet CDN was slow
  };

  const onWebViewLoad = () => {
    if (currentUser) {
      postToWebView({ type: 'user', lat: currentUser.location.lat, lng: currentUser.location.lng });
    }
    postToWebView({ type: 'players', players });
    postToWebView({ type: 'spots', spots });
  };

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        blobUrl ? (
          <iframe
            ref={iframeRef}
            src={blobUrl}
            style={{ width: '100%', height: '100%', border: 'none' } as any}
            onLoad={onIframeLoad}
            title="Boarder Map"
          />
        ) : null
      ) : (
        <WebView
          ref={webviewRef}
          source={{ html: leafletHtmlForWebView }}
          style={{ flex: 1, backgroundColor: colors.background }}
          onMessage={(event) => handleMessage(event.nativeEvent.data)}
          onLoad={onWebViewLoad}
          scrollEnabled={false}
          bounces={false}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          allowsInlineMediaPlayback
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
