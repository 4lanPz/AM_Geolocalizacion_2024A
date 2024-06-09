# CV usando Ionic

Hacer un página que permita ver la geolocalización actual del usuario y enviarlo a firebase storage utilizando Ionic, Visual Studio Code y Android Studio

## Pasos

- 1 Pre requisitos

Tener instalado Node.JS y Npm
Tener un IDE para customizar nuestro proyecto en este caso Visual Studio Code
Tener una cuenta de Firebase y sus credenciales
Tener Android Studio configurado
Estos se pueden descargar desde la pagina web oficial de dependiendo de el OS que estes utilizando.

- 2 Empezar el proyecto

Para empezar el proyecto hay que ejecutar el siguiente comando

```bash
ionic Start nombreproyecto blank --type=angular
```

En este nombreproyecto es el nombre que le vamos a poner a nuestro proyecto, por lo que se puede poner el
que tu quieras para tu proyecto.

En este tambien debemos elegir que módulos vamos a ocupar, en este caso vamos a ocupar "NGModules"

Al finalizar no es necesario tener una cuenta de Ionic, asi que eso podemos indicar que no y con eso nuestro
proyecto se ha creado

- 3 Navegar al directorio e intalación dependencias
Utilizando la consola CMD podemos ir a el directorio de nuestro proyecto con 
```bash
cd nombreproyecto
```
Dentro de esta carpeta tendremos que instalar los módulos necesarios para que se ejecute nuestro proyecto:

```bash
npm install --legacy-peer-deps
```
Después de instalar los módulos del proyecto, es necesario instalar firebase authentication, ya que este nos dara los servicios necesarios para poder generar la logica del login y registro
Para ello necesitamos ejecutar el siguiente comando
```bash
npm install @angular/fire firebase@9.16.0 --legacy-peer-deps
npm install @ionic-native/native-geocoder --legacy-peer-deps
ionic g page home
```
Una configuracion en las reglas de nuestro Firebase Storage para que nos permita ingresar archivos aun sin estar autenticados es:
```bash
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.time <timestamp.date(2024,7,9); // Permitir acceso no autenticado
    }
  }
}
```
Cuando generemos nuestro apikey nos debe entregar algo como esto
```bash
firebaseConfig: {
    apiKey: "TU_API_KEY",
    authDomain: "TU_AUTH_DOMAIN",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_STORAGE_BUCKET",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID",
    measurementId: "TU_MEASUREMENT_ID"
  }
```
- 4 Funcionalidad
Para empezar a generar el código necesitamos realizar una importación de los modulos necesarios para el proyecto:
```bash
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { environment } from '../environments/environment';
// geolocation and native-geocoder
import { Geolocation } from '@ionic-native/geolocation/ngx';
import {
  NativeGeocoder,
  NativeGeocoderResult,
  NativeGeocoderOptions,
} from '@ionic-native/native-geocoder/ngx';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireStorageModule,
    AngularFirestoreModule,
  ],
  providers: [
    Geolocation,
    NativeGeocoder,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
  ],
  
  bootstrap: [AppComponent],
})
export class AppModule {}
```
También deberemos ingresar nuestras credenciales en "environment.ts" para poder subir el txt a nuestro storage

Ahora empezamos a codificar la lógica de la geolocalización, en esta vamos a traer la longitud y la latitud de nuestro equipo.
Para ellos vamos a editar el archivo "home.modules.ts"

```bash
nombreproyecto/
├── node_modules/
├── src/   <----------
│   ├── app/ <----------
│   │   ├── home/ <---------- se encuentra aqui
```
En este necesitamos importar los módulos necesarios y generar los datos que dan la funcionalidad de obtener la geolocalización:
```bash
import {
  NativeGeocoder,
  NativeGeocoderResult,
  NativeGeocoderOptions,
} from '@ionic-native/native-geocoder/ngx';
////
latitude: any = 0; //latitude
  longitude: any = 0; //longitude
  address: string;

  constructor(
    private geolocation: Geolocation,
    private nativeGeocoder: NativeGeocoder,
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
```
En este lo que estamos haciendo es un reverse geolocalización o sea traer los datos de la geolocalización de nuestra localización mostrando la latitud y longitud actual.

Ahora hay que agregar la lógica para poder enviar nuestros datos a nuestro Storage, para ello necesitamos importar los módulos del Storage y generar la lógica.
```bash
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs/operators';
////
//constructor
private afStorage: AngularFireStorage
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
///// llamar funciones

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
```

En este lo que hacemos es que al momento de presionar el botón para obtener la geolocalización tambien va a generar un archivo que cuenta con la información resultante, en este caso de la latitud y longitud, al tener esos datos se genera un Blob o tambien llamado  "Objeto binario grande", eso para poder representar los archivos que vamos a subir, en este caso un texto y que este se pueda ver desde nuestro Storage, luego de crear el archivo que en el codigo se llama "coordenadas.txt", este es enviado a Firebase Storage.

Ahora ya con nuestra lógica podemos pasar a editar nuestro HTML para utilizar las funcionalidades ya codificadas
```bash
<ion-header>
  <ion-toolbar>
    <ion-title> Ejemplo de Ionic - Geolocalización </ion-title>
  </ion-toolbar>
</ion-header>

<ion-content>
  <div class="ion-padding">
    <ion-button (click)="getCurrentCoordinates()" expand="block">
      Obtener localización
    </ion-button>

    <ion-list>
      <ion-list-header>
        <ion-label>Coordenadas obtenidas</ion-label>
      </ion-list-header>
      <ion-item>
        <ion-label> Latitud </ion-label>
        <ion-badge color="danger" slot="end">{{latitude}}</ion-badge>
      </ion-item>
      <ion-item>
        <ion-label> Longitud </ion-label>
        <ion-badge color="danger" slot="end">{{longitude}}</ion-badge>
      </ion-item>
    </ion-list>
  </div>
</ion-content>
```
Ahora cada vez que aplastemos nuestro botón nos mostrará la localización de nuestro equipo actual, en web puede llegar a dar un error y este nos dará una localización "emulada" de un lugar específico, para poder ver si funciona correctamente podemos ir a las herramientas del desarrollador y en sensores podemos cambiar la localización y al volver a presionar el bóton nos dará otra latitud y longitud.
- 5 Ejecución
Para poder probar nuestro proyecto y ver los cambios que hemos hecho a nuestro proyecto se debe ejecutar
```bash
npx ionic start 
```
ahora el programa empezará a generar nuestro proyecto para el sistema en el que estamos ejecutando, en este caso
Windows.
Para poder revisarlo en android es necesario tener un programa que pueda generar el paquete APK
En este caso Android Studio.
Para esto primero necesitaremos hacer un build para android por lo que ejecutamos:
Un problema que suele ocurrir al momento de generar el build de Android es que no suele encontrar las credenciales de Firebase, para solucionar esto hay que pasar las credenciales de enviroment.ts y copiarlas tambien en enviroment.prod.ts
```bash
npx ionic build android
```
Al ejecutar ese código empezará a generar los archivos necesarios para que el mismo proyecto que vimos en web se
pueda ver en Android.
Luego de tener generado el build para android se debe ejecutar el comando

```bash
npx ionic capacitor open android
```
Con esto se abrirá Android Studio y si ya tenemos un dispositivo configurado, podremos ver como se ve nuestro
proyecto en android

## Capturas
### Web
![image](https://github.com/4lanPz/AM_Geolocalizacion_2024A/assets/117743495/0cb08c82-c0a1-488f-80c2-e2d5f902f89a)

![image](https://github.com/4lanPz/AM_Geolocalizacion_2024A/assets/117743495/118c8dec-9d81-4669-bd69-03555fcbdad8)


### Android
Error por dependencias que ya no tienen soporte y posible cambio a las nuevas librerias "npm install @awesome-cordova-plugins" no existe un plugin que lo reemplace
