import { Component, OnInit } from '@angular/core';
import { Test } from 'src/services/test.model';
import { TestService } from 'src/services/test.service';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss']
})
export class TestComponent implements OnInit {

  returnMessage : string;

  constructor(private testService : TestService) { }

  ngOnInit(): void {
    this.returnMessage = '';
  }

  public onClick() {
    this.testService.getWeatherForeCasts().subscribe( res => {
      if(res){
        let arr = res as Test[];
        arr.forEach(element => {
          this.returnMessage += element.summary + (", ");
        });
      }
    })
  }
}
