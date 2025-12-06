import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgIf, NgClass } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgClass, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  registerForm: FormGroup;
  submitted = false;
  loading = false;

  constructor(private fb: FormBuilder) {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      companyName: ['', [Validators.required]],
      phone: [''],
      role: ['owner', [Validators.required]],
      storeUrl: ['', [Validators.required]],
      plan: ['starter', [Validators.required]],
      agree: [false, [Validators.requiredTrue]],
    });
  }

  get f(): any {
    return this.registerForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;

    setTimeout(() => {
      this.loading = false;
      console.log('Register payload', this.registerForm.value);
      alert('Demo: account created. In the real system this will send a 2FA code and move to payment.');
    }, 1000);
  }
}
