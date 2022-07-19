import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Test } from './test.model';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class TestService {

  private url = '/api/test/'

  constructor(private httpClient : HttpClient) { }

  public getWeatherForeCasts() : Observable<Test[]>{
    return this.httpClient.get<Test[]>(environment.API_URL + this.url + 'forecasts');
  }
}
