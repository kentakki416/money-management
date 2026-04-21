import iconv from "iconv-lite"

/**
 * CSVファイルのBufferをUTF-8文字列にデコードする
 * BOM付きUTF-8はそのままデコードし、それ以外はShift-JIS（CP932）としてデコードする
 * 日本の金融機関（MUFG, SMBC等）のCSVはShift-JISで出力されるため
 */
export const decodeCsvBuffer = (buffer: Buffer): string => {
  const hasBom = buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf
  if (hasBom) {
    return buffer.toString("utf-8").slice(1)
  }

  return iconv.decode(buffer, "cp932")
}
