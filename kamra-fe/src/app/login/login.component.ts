import { Component, OnInit } from '@angular/core';
import { LoginService } from './login/login.service';
import { FormBuilder } from '@angular/forms';
import { Login } from './login/login.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loginForm = this.formBuilder.group({
    email: '',
    password: ''
  });

  constructor(private service : LoginService,
    private formBuilder: FormBuilder) { }

  ngOnInit(): void {
  }

  onSubmit(): void {
    let model = new Login();

    model.Email = this.loginForm.controls.email.getRawValue();
    model.Password = this.loginForm.controls.password.getRawValue();

    this.service.postLogin(model).subscribe( res =>{
      localStorage.setItem('token',res as string);
    })
  }

  userTest(): void {
    this.service.getUserTest().subscribe( res =>{
      console.log(res);
    })
  }

  saTest(): void {
    this.service.getSATest().subscribe( res =>{
      console.log(res);
    })
  }
}
