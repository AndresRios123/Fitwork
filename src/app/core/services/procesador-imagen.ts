import { Injectable } from '@angular/core';

const TAMANO_MAXIMO = 5 * 1024 * 1024; // 5 MB

// Convierte la foto que sube el usuario en un avatar cuadrado y liviano
// (recorte centrado, 128×128 px, JPEG) para poder guardarlo sin ocupar mucho.
@Injectable({ providedIn: 'root' })
export class ProcesadorImagen {
  async crearAvatar(archivo: File, lado = 128): Promise<string> {
    if (!archivo.type.startsWith('image/')) {
      throw new Error('El archivo debe ser una imagen (JPG, PNG, WebP…).');
    }
    if (archivo.size > TAMANO_MAXIMO) {
      throw new Error('La imagen no puede pesar más de 5 MB.');
    }

    let imagen: ImageBitmap;
    try {
      imagen = await createImageBitmap(archivo);
    } catch {
      throw new Error('No se pudo leer la imagen. Prueba con otro archivo.');
    }

    const corte = Math.min(imagen.width, imagen.height);
    const canvas = document.createElement('canvas');
    canvas.width = lado;
    canvas.height = lado;
    canvas.getContext('2d')?.drawImage(
      imagen,
      (imagen.width - corte) / 2, (imagen.height - corte) / 2, corte, corte,
      0, 0, lado, lado,
    );
    imagen.close();
    return canvas.toDataURL('image/jpeg', 0.85);
  }
}
