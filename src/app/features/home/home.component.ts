import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, NgIf, NgClass],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  activeAudience: 'owners' | 'agencies' | 'developers' = 'owners';
  botOpen = false;

  setAudience(audience: 'owners' | 'agencies' | 'developers') {
    this.activeAudience = audience;
  }

  toggleBot() {
    this.botOpen = !this.botOpen;
  }
}
