import { Component, OnInit } from '@angular/core';
import { SignupService } from './signup/signup.service';
import { FormBuilder } from '@angular/forms';
import { Signup } from './signup/signup.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {

  constructor(private service : SignupService,
    private formBuilder: FormBuilder) { }

  regForm = this.formBuilder.group({
      email: '',
      password: '',
      passwordAgain: ''
    });

  ngOnInit(): void {
  }

  onSubmit(): void {
    let model = new Signup();

    model.Email = this.regForm.controls.email.getRawValue();
    model.Password = this.regForm.controls.password.getRawValue();
    model.PasswordAgain = this.regForm.controls.passwordAgain.getRawValue();
    model.Lang = environment.lang;
    
    this.service.postSignUp(model).subscribe( res =>
      res)
  }
}
