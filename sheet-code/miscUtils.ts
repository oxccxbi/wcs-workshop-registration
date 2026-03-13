function parseMaxParticipantsPerPass(input: string): Record<WsPass, number> {
  const tokens = input.split(/[\s,]+/).filter(t => t.length > 0);
  const result: Record<WsPass, number> = {} as any;

  const isValidWsPass = (value: string): value is WsPass => {
    return ["LEVEL_1", "LEVEL_2", "PARTY_1", "PARTY_2"].includes(value);
  }

  for (let i = 0; i < tokens.length; i += 2) {
    if (i + 1 < tokens.length) {
      const pass = tokens[i];
      const limit = parseInt(tokens[i + 1]);
      if (isValidWsPass(pass) && !isNaN(limit)) {
        result[pass] = limit;
      }
    }
  }

  return result;
}