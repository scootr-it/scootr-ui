import { AfterViewInit, Component } from '@angular/core';
import { differenceInSeconds } from 'date-fns';
import * as L from "leaflet";
import "leaflet.markercluster";
import { interval } from 'rxjs';
import { ApiService, IRide, IVehicle } from 'src/app/services/api/api.service';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'signed-in-home',
  templateUrl: './signed-in.component.html',
  styleUrls: ['./signed-in.component.scss']
})
export class SignedInHomeComponent implements AfterViewInit
{
  public activeRide: IRide | null = null;
  public activeRideTimeString = "00:00";
  public activeRideEstimatedCost = 0;

  private vehicles: IVehicle[] = [];

  private map?: L.Map;
  private markers?: L.MarkerClusterGroup;
  private currentPositionMarker?: L.Marker;

  // Rome, IT
  public currentLocation: L.LatLngExpression = [ 41.9027835, 12.4963655 ];

  public canUseGeolocation = true;
  public hasGrantedGeolocationPermission = false;

  constructor(private api: ApiService, private auth: AuthService)
  {}

  public ngAfterViewInit()
  {
    this.initMap();

    this.setMapCenter();

    this.loadVehicles();

    this.retrieveActiveRide();

    this.askForGeolocationPermission();
  }

  public async endRide()
  {
    if (!this.activeRide)
    {
      return;
    }

    const response = await this.api.endRide(this.activeRide.id);

    if (response.success)
    {
      this.activeRide = null;
    }
  }

  public setMapCenter(coords?: L.LatLngExpression)
  {
    if (!this.map)
    {
      return;
    }

    this.map.setView(coords ?? this.currentLocation);

    this.currentPositionMarker ??= L
      .marker(
        this.currentLocation,
        {
          icon: L.icon({
            iconUrl: "/assets/marker-icon.png",
            shadowUrl: "/assets/marker-shadow.png",
            iconRetinaUrl: "/assets/marker-icon-2x.png",
            iconSize: [ 25, 41 ],
            iconAnchor: [ 12.5, 41 ],
          }),
        }
      )
      .addTo(this.map);

    this.currentPositionMarker.setLatLng(this.currentLocation);
  }

  public async searchPlace(query: string)
  {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);

    const body: {
      lat: number,
      lon: number,
    }[] = await response.json();

    this.setMapCenter(
      [
        body[0].lat,
        body[0].lon,
      ],
    );
  }

  private askForGeolocationPermission()
  {
    this.canUseGeolocation = "geolocation" in navigator;

    if (this.canUseGeolocation)
    {
      navigator.geolocation.getCurrentPosition(
        position =>
        {
          this.hasGrantedGeolocationPermission = true;

          this.currentLocation = [
            position.coords.latitude,
            position.coords.longitude,
          ];

          this.setMapCenter();
        },
        error =>
        {
          if (error.code === error.PERMISSION_DENIED)
          {
            this.hasGrantedGeolocationPermission = false;
          }
        },
      );
    }
  }

  private initMap()
  {
    this.map = L
      .map("map", {
        zoom: 19,
        zoomControl: false,
      })
      .on("viewreset", () => this.loadVehicles())
      .on("moveend", () => this.loadVehicles())
      .on("zoomend", () => this.loadVehicles());

    L
      .control
      .zoom({
        position: "bottomleft",
      })
      .addTo(this.map);

    this.markers = L
      .markerClusterGroup()
      .addTo(this.map);

    L
      .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        minZoom: 15,
        attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
      })
      .addTo(this.map);
  }

  private async loadVehicles()
  {
    if (!this.map || !this.markers)
    {
      return;
    }

    const center = this.map.getCenter();

    const response = await this.api.listVehiclesNearLocation(
      {
        latitude: center.lat,
        longitude: center.lng,
      },
      center.distanceTo(this.map.getBounds().getNorthEast()),
    );

    if (response.data)
    {
      const newVehicles = response.data.filter(v =>
      {
        return !this.vehicles.find(_ => _.id === v.id);
      });

      this.vehicles = [ ...this.vehicles, ...newVehicles ];

      for (const vehicle of newVehicles)
      {
        this.markers
          .addLayer(
            L
              .marker(
                [
                  vehicle.location.latitude,
                  vehicle.location.longitude,
                ],
                {
                  icon: L.icon({
                    iconUrl: "/assets/vehicles/scooter.png",
                    iconSize: [ 25, 25 ],
                  }),
                },
              )
              .bindPopup(
                L
                  .popup()
                  .setContent(`Livello batteria: ${vehicle.battery_level}%`),
              ),
          );
      }
    }
  }

  private async retrieveActiveRide()
  {
    if (!this.auth.user)
    {
      return;
    }

    const { data } = await this.api.retrieveActiveRide(this.auth.user.id);

    if (!data)
    {
      return;
    }

    this.activeRide = data;

    const intervalSubscription = interval(1000).subscribe(() =>
    {
      if (!this.activeRide)
      {
        intervalSubscription.unsubscribe();

        return;
      }

      const difference = differenceInSeconds(new Date(), new Date(this.activeRide.start_time));

      const minutes = Math.floor(difference / 60);
      const seconds = difference % 60;

      this.activeRideTimeString = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      this.activeRideEstimatedCost = 1 + (0.2 * minutes);
    });
  }
}
