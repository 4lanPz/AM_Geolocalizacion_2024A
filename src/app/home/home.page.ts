import { Component } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs/operators';
import {
  NativeGeocoder,
  NativeGeocoderResult,
  NativeGeocoderOptions,
} from '@ionic-native/native-geocoder/ngx';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  latitude: any = 0; //latitude
  longitude: any = 0; //longitude
  address: string;

  constructor(
    private geolocation: Geolocation,
    private nativeGeocoder: NativeGeocoder,
    private afStorage: AngularFireStorage
  ) {}

  // geolocation options
  options = {
    timeout: 10000,
    enableHighAccuracy: true,
    maximumAge: 3600,
  };

  // Llamada a las funciones
  getCurrentCoordinates() {
    console.log('Getting current coordinates...');
    this.geolocation
      .getCurrentPosition(this.options)
      .then((resp) => {
        console.log('Coordinates obtained:', resp.coords);
        this.latitude = resp.coords.latitude;
        this.longitude = resp.coords.longitude;
        this.getAddress(this.latitude, this.longitude);
        const fileContent = this.createFileContent(
          this.latitude,
          this.longitude
        );
        console.log(fileContent);
        this.uploadFileToStorage('coordenadas.txt', fileContent);
      })
      .catch((error) => {
        console.log('Error getting location', error);
      });
  }

  // geocoder options
  nativeGeocoderOptions: NativeGeocoderOptions = {
    useLocale: true,
    maxResults: 5,
  };

  // get address using coordinates
  getAddress(lat: any, long: any) {
    this.nativeGeocoder
      .reverseGeocode(lat, long, this.nativeGeocoderOptions)
      .then((res: NativeGeocoderResult[]) => {
        this.address = this.pretifyAddress(res[0]);
      })
      .catch((error: any) => {
        alert('Error getting location' + JSON.stringify(error));
      });
  }

  // address
  pretifyAddress(address: any) {
    let obj = [];
    let data = '';
    for (let key in address) {
      obj.push(address[key]);
    }
    obj.reverse();
    for (let val in obj) {
      if (obj[val].length) data += obj[val] + ', ';
    }
    return data.slice(0, -2);
  }

  // Función para crear el contenido del archivo de texto
  createFileContent(lat: number, long: number): string {
    return `Latitude: ${lat}, Longitude: ${long}`;
  }

  // Función para subir el archivo a Firebase Storage
  uploadFileToStorage(filePath: string, fileContent: string) {
    // Convertir el contenido del archivo a un Blob
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const fileRef = this.afStorage.ref(filePath);
    const task = this.afStorage.upload(filePath, blob);
    task
      .snapshotChanges()
      .pipe(
        finalize(() => {
          // Obtener la URL de descarga del archivo
          fileRef.getDownloadURL().subscribe((url) => {
          });
        })
      )
      .subscribe();
  }
}
