import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Platform, Animated, Image, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../../hooks/useColors';
import {
  GRID, PIECES, PieceDef, PlacedPiece,
  emptyGrid, getPieceCells, canPlace, placePiece,
  randomPlacement, resolveAttack, cpuPickCell,
  Grid, CellState,
} from '../../lib/gameLogic';

// ────────────────────────────────────────────────────────────────[...]
// Types
// ────────────────────────────────────────────────────────────────[...]
type Phase = 'placement' | 'battle' | 'gameover';
type Turn = 'player' | 'cpu';

// ────────────────────────────────────────────────────────────────[...]
// Cell size — scales to fit screen
// ────────────────────────────────────────────────────────────────[...]
const CELL = Platform.OS === 'web' ? 36 : 28;
const GRID_PX = CELL * GRID;

// ────────────────────────────────────────────────────────────────[...]
// Explosion animation per cell
// ────────────────────────────────────────────────────────────────[...]
function useFlash() {
  const anim = useRef(new Animated.Value(0)).current;
  const flash = () => {
    anim.setValue(1);
    Animated.timing(anim, { toValue: 0, duration: 600, useNativeDriver: Platform.OS !== 'web' }).start();
  };
  return { anim, flash };
}

// ────────────────────────────────────────────────────────────────[...]
// Single cell component
// ────────────────────────────────────────────────────────────────[...]
interface CellProps {
  state: CellState;
  isPreview?: boolean;
  isPreviewValid?: boolean;
  onPress?: () => void;
  flashAnim?: Animated.Value;
  showShip?: boolean;
}

function Cell({ state, isPreview, isPreviewValid, onPress, flashAnim, showShip }: CellProps) {
  const colors = useColors();

  let bg = 'transparent';
  let marker: React.ReactNode = null;

  if (state === 'hit') {
    bg = '#ef444433';
    marker = <Text style={styles.markerText}>💥</Text>;
  } else if (state === 'sunk') {
    // Overlay image is rendered at GridView level; just darken the cell
    bg = '#7f1d1d66';
  } else if (state === 'miss') {
    // Distinct deep-blue with a water ripple marker
    bg = '#0a2a4a99';
    marker = (
      <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <View style={{
          width: CELL * 0.62,
          height: CELL * 0.62,
          borderRadius: CELL,
          borderWidth: 1.5,
          borderColor: '#60a5fa',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <View style={{
            width: CELL * 0.26,
            height: CELL * 0.26,
            borderRadius: CELL,
            backgroundColor: '#93c5fd55',
          }} />
        </View>
        {/* Crack lines */}
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
          <View style={{ position: 'absolute', width: 1, height: CELL * 0.9, backgroundColor: '#3b82f622', transform: [{ rotate: '30deg' }] }} />
          <View style={{ position: 'absolute', width: 1, height: CELL * 0.9, backgroundColor: '#3b82f622', transform: [{ rotate: '-45deg' }] }} />
        </View>
      </View>
    );
  } else if (state === 'ship' && showShip) {
    bg = colors.primary + '44';
  }

  if (isPreview) {
    bg = isPreviewValid ? colors.primary + '66' : '#ef444466';
  }

  return (
    <Pressable onPress={onPress} style={[styles.cell, { width: CELL, height: CELL, backgroundColor: bg }]}>
      {marker}
      {flashAnim && (
        <Animated.View style={[
          StyleSheet.absoluteFill,
          { backgroundColor: '#ef4444', opacity: flashAnim, borderRadius: 2 }
        ]} />
      )}
    </Pressable>
  );
}

// ────────────────────────────────────────────────────────────────[...]
// Sunk piece overlay data
// ────────────────────────────────────────────────────────────────[...]
interface SunkOverlay {
  piece: PlacedPiece;
  def: PieceDef;
}

// ────────────────────────────────────────────────────────────────[...]
// Grid component
// ────────────────────────────────────────────────────────────────[...]
interface GridViewProps {
  grid: Grid;
  onCellPress?: (r: number, c: number) => void;
  previewCells?: [number, number][];
  previewValid?: boolean;
  showShips?: boolean;
  flashCell?: [number, number] | null;
  label: string;
  colors: any;
  sunkOverlays?: SunkOverlay[];
  isActive?: boolean;
}

function GridView({ grid, onCellPress, previewCells, previewValid, showShips, flashCell, label, colors, sunkOverlays, isActive }: GridViewProps) {
  const { anim, flash: triggerFlash } = useFlash();

  React.useEffect(() => {
    if (flashCell) triggerFlash();
  }, [flashCell]);

  const previewSet = new Set((previewCells ?? []).map(([r, c]) => `${r},${c}`));

  return (
    <View>
      <Text style={[styles.gridLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[
        styles.gridBorder,
        {
          borderColor: isActive ? colors.accent : colors.border,
          borderWidth: isActive ? 3 : 1,
        }
      ]}>
        {Array.from({ length: GRID }, (_, r) => (
          <View key={r} style={styles.row}>
            {Array.from({ length: GRID }, (_, c) => {
              const isCheckerDark = (r + c) % 2 === 0;
              const isFlash = flashCell?.[0] === r && flashCell?.[1] === c;
              const isPrev = previewSet.has(`${r},${c}`);
              return (
                <View
                  key={c}
                  style={[
                    styles.cell,
                    { width: CELL, height: CELL },
                    { backgroundColor: isCheckerDark ? colors.surfaceHigh + 'aa' : colors.card + 'aa' },
                  ]}
                >
                  <Cell
                    state={grid[r][c]}
                    isPreview={isPrev}
                    isPreviewValid={previewValid}
                    onPress={onCellPress ? () => onCellPress(r, c) : undefined}
                    flashAnim={isFlash ? anim : undefined}
                    showShip={showShips}
                  />
                </View>
              );
            })}
          </View>
        ))}

        {/* Sunk piece image overlays — positioned absolutely over their cells */}
        {sunkOverlays?.map(({ piece, def }) => {
          const rows = piece.cells.map(([r]) => r);
          const cols = piece.cells.map(([, c]) => c);
          const minRow = Math.min(...rows);
          const maxRow = Math.max(...rows);
          const minCol = Math.min(...cols);
          const maxCol = Math.max(...cols);
          const w = (maxCol - minCol + 1) * CELL;
          const h = (maxRow - minRow + 1) * CELL;

          // Detect rotation: compare placed bounding box against the definition's default.
          // When rotated, rows↔cols are swapped, so placedW matches defH and vice-versa.
          const defRows = def.cells.map(([r]) => r);
          const defCols = def.cells.map(([, c]) => c);
          const defH = (Math.max(...defRows) - Math.min(...defRows) + 1) * CELL;
          const defW = (Math.max(...defCols) - Math.min(...defCols) + 1) * CELL;
          // Only meaningful when piece is non-square
          const isRotated = defH !== defW && w === defH && h === defW;

          // For a rotated piece the image is rendered in its natural (un-rotated) dimensions
          // (imgW × imgH = defW × defH), then rotated 90° around its center.
          // The translation (left, top) shifts the image so its center aligns with the
          // container's center before the CSS transform is applied.
          const imgStyle = isRotated
            ? {
                position: 'absolute' as const,
                width: defW,
                height: defH,
                left: (w - defW) / 2,
                top: (h - defH) / 2,
                opacity: 0.72,
                transform: [{ rotate: '90deg' }],
              }
            : { width: w, height: h, opacity: 0.72 };

          return (
            <View
              key={def.id}
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: minRow * CELL,
                left: minCol * CELL,
                width: w,
                height: h,
                overflow: 'hidden',
              }}
            >
              <Image
                source={def.asset}
                style={imgStyle}
                resizeMode="contain"
              />
              {/* Gray desaturate overlay */}
              <View style={[StyleSheet.absoluteFill, { backgroundColor: '#66666699' }]} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────[...]
// Piece tray item
// ────────────────────────────────────────────────────────────────[...]
interface PieceTrayItemProps {
  piece: PieceDef;
  placed: boolean;
  selected: boolean;
  onSelect: () => void;
  colors: any;
}

function PieceTrayItem({ piece, placed, selected, onSelect, colors }: PieceTrayItemProps) {
  return (
    <Pressable
      onPress={placed ? undefined : onSelect}
      style={[
        styles.trayItem,
        {
          backgroundColor: selected ? colors.primary + '33' : colors.card,
          borderColor: selected ? colors.primary : colors.border,
          opacity: placed ? 0.35 : 1,
        },
      ]}
    >
      <Image source={piece.asset} style={styles.trayIcon} resizeMode="contain" />
      <Text style={[styles.trayLabel, { color: colors.foreground }]} numberOfLines={1}>
        {piece.label}
      </Text>
      {placed && <Feather name="check" size={12} color={colors.primary} style={{ marginTop: 2 }} />}
    </Pressable>
  );
}

// ────────────────────────────────────────────────────────────────[...]
// Helpers
// ────────────────────────────────────────────────────────────────[...]
function buildSunkOverlays(pieces: PlacedPiece[]): SunkOverlay[] {
  return pieces
    .filter(p => p.sunk)
    .map(p => {
      const def = PIECES.find(d => d.id === p.defId);
      return def ? { piece: p, def } : null;
    })
    .filter(Boolean) as SunkOverlay[];
}

// ────────────────────────────────────────────────────────────────[...]
// Main screen
// ────────────────────────────────────────────────────────────────[...]
export default function GameTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? insets.top + 67 : insets.top + 20;

  // ── Phase & turn ────────────────────────────────────────────────────────[...]
  const [phase, setPhase] = useState<Phase>('placement');
  const [turn, setTurn] = useState<Turn>('player');
  const [winner, setWinner] = useState<Turn | null>(null);

  // ── Grids ───────────────────────────────────────────────────────────[...]
  const [playerGrid, setPlayerGrid] = useState<Grid>(emptyGrid);
  const [cpuGrid, setCpuGrid] = useState<Grid>(emptyGrid);

  // ── Placed pieces ────────────────────────────────────────────────────────[...]
  const [playerPieces, setPlayerPieces] = useState<PlacedPiece[]>([]);
  const [cpuPieces, setCpuPieces] = useState<PlacedPiece[]>([]);

  // ── Placement state ───────────────────────────────────────────────────────
  const [selectedPiece, setSelectedPiece] = useState<PieceDef | null>(null);
  const [rotate, setRotate] = useState(false);
  const [placedIds, setPlacedIds] = useState<Set<string>>(new Set());
  const [hoverCell, setHoverCell] = useState<[number, number] | null>(null);

  // ── Flash animation target ────────────────────────────────────────────────
  const [playerFlash, setPlayerFlash] = useState<[number, number] | null>(null);
  const [cpuFlash, setCpuFlash] = useState<[number, number] | null>(null);

  // ── Status message ────────────────────────────────────────────────────────[...]
  const [status, setStatus] = useState('Place your pieces on your grid.');

  // ── Miss streak counters (refs to avoid stale closures in setTimeout) ──────
  const playerMissStreak = useRef(0);
  const cpuMissStreak = useRef(0);

  // ── Placement: preview cells ──────────────────────────────────────────────
  const previewCells: [number, number][] = (selectedPiece && hoverCell)
    ? getPieceCells(selectedPiece, hoverCell[0], hoverCell[1], rotate)
    : [];
  const previewValid = previewCells.length > 0 && canPlace(playerGrid, previewCells);

  // ───────────────────────────────────────────────────────────────[...]
  // CPU attack chain — all params passed explicitly to dodge stale closures
  // ───────────────────────────────────────────────────────────────[...]

  // Forward-declare via ref so the functions can call each other
  const cpuAttackRef = useRef<(pGrid: Grid, pPieces: PlacedPiece[]) => void>(null!);
  const cpuBonusRef = useRef<(pGrid: Grid, pPieces: PlacedPiece[], remaining: number) => void>(null!);

  // 3-hit bonus barrage for CPU
  cpuBonusRef.current = (pGrid: Grid, pPieces: PlacedPiece[], remaining: number) => {
    if (remaining === 0) {
      setStatus('CPU bonus barrage done. Your turn!');
      setTurn('player');
      return;
    }
    setTimeout(() => {
      const [cr, cc] = cpuPickCell(pGrid);
      setPlayerFlash([cr, cc]);
      const result = resolveAttack(pGrid, pPieces, cr, cc);
      setPlayerGrid(result.grid);
      setPlayerPieces(result.placedPieces);
      if (result.gameOver) {
        setPhase('gameover');
        setWinner('cpu');
        setStatus('💀 Defeat. All your pieces were sunk.');
        return;
      }
      const def = result.sunkPiece ? PIECES.find(p => p.id === result.sunkPiece!.defId) : null;
      const msg = result.wasHit
        ? (def ? `CPU bonus sunk your ${def.label}! (${remaining - 1} bonus left)` : `CPU bonus hit! (${remaining - 1} bonus left)`)
        : `CPU bonus miss. (${remaining - 1} bonus left)`;
      setStatus(msg);
      cpuBonusRef.current(result.grid, result.placedPieces, remaining - 1);
    }, 1200);
  };

  // Main CPU attack — hits again on success, ends turn on miss
  cpuAttackRef.current = (pGrid: Grid, pPieces: PlacedPiece[]) => {
    setTimeout(() => {
      const [cr, cc] = cpuPickCell(pGrid);
      setPlayerFlash([cr, cc]);
      const result = resolveAttack(pGrid, pPieces, cr, cc);
      setPlayerGrid(result.grid);
      setPlayerPieces(result.placedPieces);

      if (result.gameOver) {
        setPhase('gameover');
        setWinner('cpu');
        setStatus('💀 Defeat. All your pieces were sunk.');
        return;
      }

      if (result.wasHit) {
        // CPU keeps attacking on a hit
        cpuMissStreak.current = 0;
        const def = result.sunkPiece ? PIECES.find(p => p.id === result.sunkPiece!.defId) : null;
        setStatus(def
          ? `CPU sunk your ${def.label}! CPU attacks again…`
          : 'CPU hit! Attacking again…'
        );
        cpuAttackRef.current(result.grid, result.placedPieces);
      } else {
        const newStreak = cpuMissStreak.current + 1;
        cpuMissStreak.current = newStreak;
        if (newStreak >= 4) {
          cpuMissStreak.current = 0;
          setStatus('CPU missed 4 times in a row! Bonus barrage! 💥');
          cpuBonusRef.current(result.grid, result.placedPieces, 3);
        } else {
          setStatus('CPU missed. Your turn!');
          setTurn('player');
        }
      }
    }, 1200);
  };

  // ── Player bonus barrage ──────────────────────────────────────────────────
  const playerBonusRef = useRef<(
    cGrid: Grid, cPieces: PlacedPiece[],
    pGrid: Grid, pPieces: PlacedPiece[],
    remaining: number
  ) => void>(null!);

  playerBonusRef.current = (
    cGrid: Grid, cPieces: PlacedPiece[],
    pGrid: Grid, pPieces: PlacedPiece[],
    remaining: number,
  ) => {
    if (remaining === 0) {
      setStatus('Bonus barrage done! CPU\'s turn…');
      setTurn('cpu');
      cpuAttackRef.current(pGrid, pPieces);
      return;
    }
    setTimeout(() => {
      const [br, bc] = cpuPickCell(cGrid); // reuse to pick random unattacked cell
      setCpuFlash([br, bc]);
      const result = resolveAttack(cGrid, cPieces, br, bc);
      setCpuGrid(result.grid);
      setCpuPieces(result.placedPieces);
      if (result.gameOver) {
        setPhase('gameover');
        setWinner('player');
        setStatus('🎉 You win! All enemy pieces sunk!');
        return;
      }
      const def = result.sunkPiece ? PIECES.find(p => p.id === result.sunkPiece!.defId) : null;
      const msg = result.wasHit
        ? (def ? `Bonus sunk the ${def.label}! (${remaining - 1} bonus left)` : `Bonus hit! (${remaining - 1} bonus left)`)
        : `Bonus miss. (${remaining - 1} bonus left)`;
      setStatus(msg);
      playerBonusRef.current(result.grid, result.placedPieces, pGrid, pPieces, remaining - 1);
    }, 1200);
  };

  // ── Placement: tap a cell ─────────────────────────────────────────────────
  const handlePlayerCellPress = useCallback((r: number, c: number) => {
    if (phase !== 'placement' || !selectedPiece) return;
    const cells = getPieceCells(selectedPiece, r, c, rotate);
    if (!canPlace(playerGrid, cells)) {
      setStatus('Cannot place here. Try another spot.');
      return;
    }
    const newGrid = placePiece(playerGrid, cells);
    setPlayerGrid(newGrid);
    setPlayerPieces(prev => [...prev, { defId: selectedPiece.id, cells, sunk: false }]);
    const newPlaced = new Set(placedIds).add(selectedPiece.id);
    setPlacedIds(newPlaced);
    setSelectedPiece(null);
    setHoverCell(null);
    if (newPlaced.size === PIECES.length) {
      setStatus('All pieces placed! Starting battle…');
    } else {
      setStatus(`Placed ${selectedPiece.label}. Select next piece.`);
    }
  }, [phase, selectedPiece, rotate, playerGrid, placedIds]);

  // ── Start battle ────────────────────────────────────────────────────────[...]
  const handleStartBattle = useCallback(() => {
    const [cGrid, cPieces] = randomPlacement();
    setCpuGrid(cGrid);
    setCpuPieces(cPieces);
    playerMissStreak.current = 0;
    cpuMissStreak.current = 0;
    setPhase('battle');
    setTurn('player');
    setStatus('Your turn — tap a cell on the enemy grid!');
  }, []);

  // ── Player attacks CPU ────────────────────────────────────────────────────
  const handleCpuCellPress = useCallback((r: number, c: number) => {
    if (phase !== 'battle' || turn !== 'player') return;
    const cell = cpuGrid[r][c];
    if (cell === 'hit' || cell === 'miss' || cell === 'sunk') {
      setStatus('Already attacked that cell. Pick another.');
      return;
    }

    setCpuFlash([r, c]);
    const result = resolveAttack(cpuGrid, cpuPieces, r, c);
    setCpuGrid(result.grid);
    setCpuPieces(result.placedPieces);

    if (result.gameOver) {
      setPhase('gameover');
      setWinner('player');
      setStatus('🎉 You win! All enemy pieces sunk!');
      return;
    }

    if (result.wasHit) {
      // Hit → player keeps their turn
      playerMissStreak.current = 0;
      const def = result.sunkPiece ? PIECES.find(p => p.id === result.sunkPiece!.defId) : null;
      setStatus(def
        ? `You sunk the ${def.label}! Attack again!`
        : 'Hit! Attack again!'
      );
      // Stay on player's turn — do NOT setTurn or schedule CPU
    } else {
      // Miss → accumulate streak, then hand to CPU after 1.2 s pause
      const newStreak = playerMissStreak.current + 1;
      playerMissStreak.current = newStreak;

      if (newStreak >= 4) {
        playerMissStreak.current = 0;
        setStatus('4 misses in a row! Bonus barrage incoming… 💥');
        // Snapshot current playerGrid/playerPieces for the CPU turn that follows
        playerBonusRef.current(result.grid, result.placedPieces, playerGrid, playerPieces, 3);
      } else {
        setStatus(`Miss (${newStreak} in a row). CPU's turn…`);
        setTurn('cpu');
        cpuAttackRef.current(playerGrid, playerPieces);
      }
    }
  }, [phase, turn, cpuGrid, cpuPieces, playerGrid, playerPieces]);

  // ── Reset game ─────────────────────────────────────────────────────────[...]
  const handleReset = useCallback(() => {
    setPhase('placement');
    setTurn('player');
    setWinner(null);
    setPlayerGrid(emptyGrid());
    setCpuGrid(emptyGrid());
    setPlayerPieces([]);
    setCpuPieces([]);
    setSelectedPiece(null);
    setRotate(false);
    setPlacedIds(new Set());
    setHoverCell(null);
    setPlayerFlash(null);
    setCpuFlash(null);
    playerMissStreak.current = 0;
    cpuMissStreak.current = 0;
    setStatus('Place your pieces on your grid.');
  }, []);

  // ── Auto-place for player ────────────────────────────────────────────────
  const handleAutoPlace = useCallback(() => {
    const [grid, pieces] = randomPlacement();
    setPlayerGrid(grid);
    setPlayerPieces(pieces);
    setPlacedIds(new Set(PIECES.map(p => p.id)));
    setSelectedPiece(null);
    setStatus('Auto-placed! Ready to battle.');
  }, []);

  const allPlaced = placedIds.size === PIECES.length;

  // ── Sunk piece overlays ───────────────────────────────────────────────────
  const playerSunkOverlays = buildSunkOverlays(playerPieces);
  const cpuSunkOverlays = buildSunkOverlays(cpuPieces);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topInset, paddingBottom: insets.bottom + 100 }}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>BATTLEBOARD</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Board Game Edition</Text>
      </View>

      {/* Status bar */}
      <View style={[styles.statusBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.statusText, { color: colors.foreground }]}>{status}</Text>
        {phase === 'battle' && (
          <View style={[styles.turnBadge, { backgroundColor: turn === 'player' ? colors.primary : colors.accent }]}>
            <Text style={[styles.turnText, { color: colors.primaryForeground }]}>
              {turn === 'player' ? 'YOUR TURN' : 'CPU…'}
            </Text>
          </View>
        )}
      </View>

      {/* ── Placement phase ── */}
      {phase === 'placement' && (
        <View style={styles.section}>
          {/* Piece tray */}
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>SELECT PIECE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tray}>
            {PIECES.map(piece => (
              <PieceTrayItem
                key={piece.id}
                piece={piece}
                placed={placedIds.has(piece.id)}
                selected={selectedPiece?.id === piece.id}
                onSelect={() => { setSelectedPiece(piece); setHoverCell(null); }}
                colors={colors}
              />
            ))}
          </ScrollView>

          {/* Rotate toggle */}
          {selectedPiece && (
            <Pressable
              onPress={() => setRotate(r => !r)}
              style={[styles.rotateBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            >
              <Feather name="rotate-cw" size={14} color={colors.foreground} />
              <Text style={[styles.rotateBtnText, { color: colors.foreground }]}>
                Rotate ({rotate ? 'Vertical→Horizontal' : 'Horizontal→Vertical'})
              </Text>
            </Pressable>
          )}

          {/* Player grid */}
          <View style={styles.centeredGrid}>
            <GridView
              grid={playerGrid}
              onCellPress={selectedPiece ? (r, c) => {
                setHoverCell([r, c]);
                handlePlayerCellPress(r, c);
              } : undefined}
              previewCells={previewCells}
              previewValid={previewValid}
              showShips
              flashCell={null}
              label="YOUR GRID"
              colors={colors}
            />
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <Pressable onPress={handleAutoPlace} style={[styles.btn, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="shuffle" size={14} color={colors.foreground} />
              <Text style={[styles.btnText, { color: colors.foreground }]}>Auto-Place</Text>
            </Pressable>
            {allPlaced && (
              <Pressable onPress={handleStartBattle} style={[styles.btn, { backgroundColor: colors.primary }]}>
                <Feather name="zap" size={14} color={colors.primaryForeground} />
                <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Battle!</Text>
              </Pressable>
            )}
            <Pressable onPress={handleReset} style={[styles.btn, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="refresh-cw" size={14} color={colors.foreground} />
              <Text style={[styles.btnText, { color: colors.foreground }]}>Reset</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ── Battle phase ── */}
      {phase === 'battle' && (
        <View style={styles.section}>
          {/* Enemy grid */}
          <View style={styles.centeredGrid}>
            <GridView
              grid={cpuGrid}
              onCellPress={turn === 'player' ? handleCpuCellPress : undefined}
              showShips={false}
              flashCell={cpuFlash}
              label="ENEMY GRID — tap to attack"
              colors={colors}
              sunkOverlays={cpuSunkOverlays}
              isActive={turn === 'player'}
            />
          </View>

          <View style={[styles.divider, { borderColor: colors.border }]} />

          {/* Player grid (read-only, ships visible) */}
          <View style={styles.centeredGrid}>
            <GridView
              grid={playerGrid}
              showShips
              flashCell={playerFlash}
              label="YOUR GRID"
              colors={colors}
              sunkOverlays={playerSunkOverlays}
              isActive={turn === 'cpu'}
            />
          </View>

          {/* Piece status */}
          <View style={styles.pieceStatus}>
            <View style={styles.pieceStatusCol}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>YOUR FLEET</Text>
              {playerPieces.map((p, i) => {
                const def = PIECES.find(d => d.id === p.defId);
                return (
                  <View key={i} style={styles.pieceRow}>
                    <Image source={def?.asset} style={styles.pieceStatusIcon} resizeMode="contain" />
                    <Text style={[styles.pieceRowText, { color: p.sunk ? colors.destructive : colors.foreground }]}>
                      {def?.label} {p.sunk ? '☠️' : ''}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.pieceStatusCol}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ENEMY FLEET</Text>
              {cpuPieces.map((p, i) => {
                const def = PIECES.find(d => d.id === p.defId);
                return (
                  <View key={i} style={styles.pieceRow}>
                    <Image source={def?.asset} style={styles.pieceStatusIcon} resizeMode="contain" />
                    <Text style={[styles.pieceRowText, { color: p.sunk ? colors.destructive : colors.mutedForeground }]}>
                      {p.sunk ? def?.label : '???'} {p.sunk ? '☠️' : ''}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <Pressable onPress={handleReset} style={[styles.btn, { backgroundColor: colors.secondary, borderColor: colors.border, alignSelf: 'center', marginTop: 12 }]}>
            <Feather name="refresh-cw" size={14} color={colors.foreground} />
            <Text style={[styles.btnText, { color: colors.foreground }]}>Abandon</Text>
          </Pressable>
        </View>
      )}

      {/* ── Game over overlay ── */}
      <Modal visible={phase === 'gameover'} transparent animationType="fade">
        <View style={styles.gameOverBackdrop}>
          <View style={[styles.gameOverCard, { backgroundColor: colors.card, borderColor: winner === 'player' ? colors.primary : colors.destructive }]}>
            <Text style={styles.gameOverEmoji}>{winner === 'player' ? '🏆' : '💀'}</Text>
            <Text style={[styles.gameOverTitle, { color: winner === 'player' ? colors.primary : colors.destructive }]}>
              {winner === 'player' ? 'VICTORY!' : 'DEFEAT'}
            </Text>
            <Text style={[styles.gameOverSub, { color: colors.mutedForeground }]}>
              {winner === 'player'
                ? 'You sunk every enemy piece!'
                : 'The CPU outplayed you this time.'}
            </Text>
            <Pressable onPress={handleReset} style={[styles.btn, { backgroundColor: colors.primary, marginTop: 20 }]}>
              <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Play Again</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ────────────────────────────────────────────────────────────────[...]
// Styles
// ────────────────────────────────────────────────────────────────[...]
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, marginBottom: 8 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20, letterSpacing: 2 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  statusBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginBottom: 12, borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  statusText: { fontFamily: 'Inter_500Medium', fontSize: 13, flex: 1, marginRight: 8 },
  turnBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  turnText: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1 },
  section: { paddingHorizontal: 16 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 2, marginBottom: 8, marginTop: 12 },
  tray: { marginBottom: 8 },
  trayItem: {
    alignItems: 'center', borderRadius: 10, borderWidth: 1,
    padding: 8, marginRight: 8, width: 72,
  },
  trayIcon: { width: 36, height: 36, marginBottom: 4 },
  trayLabel: { fontFamily: 'Inter_500Medium', fontSize: 10, textAlign: 'center' },
  rotateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8,
    alignSelf: 'flex-start', marginBottom: 10,
  },
  rotateBtnText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  centeredGrid: { alignItems: 'center', marginVertical: 8 },
  gridLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 2, marginBottom: 6, textAlign: 'center' },
  gridBorder: { borderWidth: 1, borderRadius: 4 },
  row: { flexDirection: 'row' },
  cell: { borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
  markerText: { fontSize: CELL * 0.45, textAlign: 'center', lineHeight: CELL },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12, justifyContent: 'center' },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 8, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10,
  },
  btnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  divider: { borderTopWidth: 1, marginVertical: 16 },
  pieceStatus: { flexDirection: 'row', gap: 16, marginTop: 8 },
  pieceStatusCol: { flex: 1 },
  pieceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  pieceStatusIcon: { width: 24, height: 24 },
  pieceRowText: { fontFamily: 'Inter_400Regular', fontSize: 12, flex: 1 },
  gameOverBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
  gameOverCard: {
    width: '80%', maxWidth: 320, alignItems: 'center',
    borderRadius: 20, borderWidth: 2, padding: 32,
  },
  gameOverEmoji: { fontSize: 56, marginBottom: 8 },
  gameOverTitle: { fontFamily: 'Inter_700Bold', fontSize: 32, letterSpacing: 2, marginBottom: 8 },
  gameOverSub: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center' },
});
