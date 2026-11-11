import { validateGameData, contentChecksum, CREATURES, CONTENT_VERSION } from "@eidolith/game-data";
const problems = validateGameData();
if (problems.length) { console.error("GAME DATA INVALID:"); problems.forEach(p => console.error(" -", p)); process.exit(1); }
console.log(`Game data OK: ${CREATURES.length} creatures, content v${CONTENT_VERSION}, checksum ${contentChecksum()}`);
