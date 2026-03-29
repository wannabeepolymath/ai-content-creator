export function parseSseFrames(buffer: string) {
  const parsed: Array<{ event: string; data: unknown }> = [];
  let nextBuffer = buffer;
  while (true) {
    const separatorIndex = nextBuffer.indexOf("\n\n");
    if (separatorIndex < 0) {
      break;
    }
    const frame = nextBuffer.slice(0, separatorIndex);
    nextBuffer = nextBuffer.slice(separatorIndex + 2);

    const lines = frame.split("\n");
    let eventName = "message";
    const dataLines: string[] = [];
    for (const line of lines) {
      if (line.startsWith("event:")) {
        eventName = line.slice(6).trim();
      }
      if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trim());
      }
    }

    if (dataLines.length === 0) {
      continue;
    }
    try {
      parsed.push({
        event: eventName,
        data: JSON.parse(dataLines.join("\n")),
      });
    } catch {
      continue;
    }
  }
  return { parsed, nextBuffer };
}
