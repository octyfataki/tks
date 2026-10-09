import { describe, expect, it } from "vitest";
import {
  GALERIE_PHOTOS_PROFIL,
  decoderDataUrlPhoto,
  nomFichierAvatar,
  photoProfilValide,
} from "./photo-profil-validation";

describe("photoProfilValide", () => {
  it("accepte un dataURL JPEG court et une illustration de la galerie", () => {
    expect(photoProfilValide("data:image/jpeg;base64," + "a".repeat(64))).toBe(true);
    expect(GALERIE_PHOTOS_PROFIL.length).toBeGreaterThanOrEqual(4);
    for (const illustration of GALERIE_PHOTOS_PROFIL) {
      expect(photoProfilValide(illustration.src)).toBe(true);
    }
  });

  it("refuse un type non image et une charge trop lourde", () => {
    expect(photoProfilValide("data:text/plain;base64," + "a".repeat(64))).toBe(false);
    expect(photoProfilValide("data:image/jpeg;base64," + "a".repeat(600 * 1024))).toBe(false);
    expect(photoProfilValide("")).toBe(false);
  });

  it("découpe un dataURL et fabrique un nom de fichier sûr", () => {
    expect(decoderDataUrlPhoto("data:image/png;base64," + "a".repeat(64))?.mime).toBe("png");
    expect(decoderDataUrlPhoto("not-a-data-url")).toBeNull();
    expect(nomFichierAvatar("abc-123_XY", "jpg")).toBe("abc-123_XY.jpg");
    expect(nomFichierAvatar("../../etc/passwd", "jpg")).toBe("______etc_passwd.jpg");
  });
});
