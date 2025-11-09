# Fluent UI 2 - Przewodnik Użycia Rozszerzonych Tokenów

## Data aktualizacji: 2025-11-09

## ✅ Nowe Tokeny - Przegląd

Plik `global.css` został rozszerzony o dodatkowe tokeny zgodne z Fluent UI 2. Poniżej praktyczne przykłady użycia.

---

## 1. 📏 Spacing Scale

### Tokeny:
```css
--space-1:  4px   (0.25rem)
--space-2:  8px   (0.5rem)
--space-3:  12px  (0.75rem)
--space-4:  16px  (1rem)
--space-5:  20px  (1.25rem)
--space-6:  24px  (1.5rem)
--space-8:  32px  (2rem)
--space-10: 40px  (2.5rem)
--space-12: 48px  (3rem)
--space-16: 64px  (4rem)
```

### Przykłady użycia:

#### Card z konsekwentnym spacingiem
```tsx
<Card 
  style={{ 
    padding: 'var(--space-6)',
    gap: 'var(--space-4)'
  }}
>
  <CardHeader style={{ marginBottom: 'var(--space-4)' }}>
    <CardTitle>Tytuł karty</CardTitle>
  </CardHeader>
  <CardContent>
    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
      <Button>Akcja</Button>
    </div>
  </CardContent>
</Card>
```

#### Layout z responsive spacing
```tsx
<div 
  className="container"
  style={{ 
    padding: 'var(--space-4)',
    marginBottom: 'var(--space-8)'
  }}
>
  <section style={{ marginTop: 'var(--space-12)' }}>
    <h2 style={{ marginBottom: 'var(--space-4)' }}>Sekcja</h2>
    <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
      {/* Zawartość */}
    </div>
  </section>
</div>
```

#### Tailwind classes (jeśli skonfigurujesz w tailwind.config.js)
```tsx
<div className="p-[var(--space-4)] gap-[var(--space-3)]">
  <Button className="mb-[var(--space-2)]">Przycisk</Button>
</div>
```

---

## 2. 📝 Typography Scale

### Tokeny:
```css
--text-xs:   12px  (0.75rem)
--text-sm:   14px  (0.875rem)
--text-base: 16px  (1rem)
--text-lg:   18px  (1.125rem)
--text-xl:   20px  (1.25rem)
--text-2xl:  24px  (1.5rem)
--text-3xl:  30px  (1.875rem)
--text-4xl:  36px  (2.25rem)

--font-normal:    400
--font-medium:    500
--font-semibold:  600
--font-bold:      700

--leading-tight:    1.2
--leading-normal:   1.5
--leading-relaxed:  1.75
```

### Przykłady użycia:

#### Hierarchia nagłówków
```tsx
<article>
  <h1 style={{ 
    fontSize: 'var(--text-4xl)',
    fontWeight: 'var(--font-bold)',
    lineHeight: 'var(--leading-tight)',
    marginBottom: 'var(--space-4)'
  }}>
    Główny nagłówek
  </h1>
  
  <h2 style={{ 
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--font-semibold)',
    lineHeight: 'var(--leading-tight)',
    marginBottom: 'var(--space-3)'
  }}>
    Podtytuł
  </h2>
  
  <p style={{ 
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-normal)',
    lineHeight: 'var(--leading-normal)',
    color: 'var(--muted-foreground)'
  }}>
    Treść artykułu z optymalną czytelnością.
  </p>
</article>
```

#### Badge z small text
```tsx
<Badge 
  style={{ 
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-medium)',
    padding: 'var(--space-1) var(--space-2)'
  }}
>
  Nowość
</Badge>
```

#### Card title
```tsx
<CardTitle style={{ 
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-semibold)',
  lineHeight: 'var(--leading-tight)'
}}>
  Tytuł karty
</CardTitle>
```

---

## 3. 📚 Z-Index Scale

### Tokeny:
```css
--z-base:     0
--z-dropdown: 1000
--z-sticky:   1100
--z-overlay:  1200
--z-modal:    1300
--z-popover:  1400
--z-toast:    1500
--z-tooltip:  1600
```

### Przykłady użycia:

#### Sticky Navigation
```tsx
<nav 
  className="sticky top-0"
  style={{ 
    zIndex: 'var(--z-sticky)',
    backdropFilter: 'blur(var(--backdrop-blur-md))',
    backgroundColor: 'var(--backdrop-tint)'
  }}
>
  <div className="container">Menu</div>
</nav>
```

#### Dropdown Menu
```tsx
<DropdownMenuContent 
  style={{ 
    zIndex: 'var(--z-dropdown)',
    boxShadow: 'var(--shadow-2)'
  }}
>
  {/* Menu items */}
</DropdownMenuContent>
```

#### Modal/Dialog
```tsx
<Dialog>
  <DialogOverlay style={{ zIndex: 'var(--z-overlay)' }} />
  <DialogContent style={{ 
    zIndex: 'var(--z-modal)',
    boxShadow: 'var(--shadow-4)'
  }}>
    {/* Zawartość */}
  </DialogContent>
</Dialog>
```

#### Toast Notifications
```tsx
<ToastContainer 
  style={{ 
    zIndex: 'var(--z-toast)',
    position: 'fixed',
    top: 'var(--space-4)',
    right: 'var(--space-4)'
  }}
>
  {toasts.map(toast => (
    <Toast key={toast.id} style={{ boxShadow: 'var(--shadow-2)' }}>
      {toast.message}
    </Toast>
  ))}
</ToastContainer>
```

---

## 4. 🎨 Extended Status Colors

### Tokeny:
```css
/* Light variants */
--success-light: oklch(0.92 0.08 145)
--warning-light: oklch(0.95 0.08 75)
--info-light:    oklch(0.92 0.06 230)
--danger-light:  oklch(0.92 0.12 29)

/* Dark variants */
--success-dark:  oklch(0.55 0.20 145)
--warning-dark:  oklch(0.65 0.18 75)
--info-dark:     oklch(0.55 0.16 230)
--danger-dark:   oklch(0.45 0.25 29)
```

### Przykłady użycia:

#### Subtle Alert
```tsx
<Alert 
  style={{ 
    backgroundColor: 'var(--success-light)',
    borderColor: 'var(--success)',
    color: 'var(--success-dark)'
  }}
>
  <AlertDescription>Operacja zakończona sukcesem!</AlertDescription>
</Alert>
```

#### Status Badge
```tsx
<Badge 
  style={{ 
    backgroundColor: 'var(--warning-light)',
    color: 'var(--warning-dark)',
    borderColor: 'var(--warning)'
  }}
>
  Oczekujące
</Badge>
```

#### Progress Indicator
```tsx
<div 
  className="progress-bar"
  style={{ 
    backgroundColor: 'var(--info-light)'
  }}
>
  <div 
    className="progress-fill"
    style={{ 
      backgroundColor: 'var(--info)',
      width: '60%'
    }}
  />
</div>
```

#### Banner z gradientem
```tsx
<div 
  style={{ 
    background: `linear-gradient(135deg, var(--danger-light) 0%, var(--danger) 100%)`,
    color: 'var(--danger-fg)',
    padding: 'var(--space-4)'
  }}
>
  <strong>Uwaga!</strong> Ważna informacja.
</div>
```

---

## 5. 🌈 Gradients

### Tokeny:
```css
--gradient-brand:  linear-gradient(135deg, brand-600 → brand-400)
--gradient-hero:   linear-gradient(180deg, background → muted)
--gradient-subtle: linear-gradient(135deg, neutral-98 → neutral-96)
```

### Przykłady użycia:

#### Hero Section
```tsx
<section 
  style={{ 
    background: 'var(--gradient-hero)',
    padding: 'var(--space-16) var(--space-4)',
    textAlign: 'center'
  }}
>
  <h1 style={{ 
    fontSize: 'var(--text-4xl)',
    fontWeight: 'var(--font-bold)',
    marginBottom: 'var(--space-4)'
  }}>
    Witaj w ShopMate
  </h1>
  <p style={{ 
    fontSize: 'var(--text-lg)',
    color: 'var(--muted-foreground)'
  }}>
    Planuj posiłki i zarządzaj zakupami
  </p>
</section>
```

#### Brand Button
```tsx
<Button 
  style={{ 
    background: 'var(--gradient-brand)',
    color: 'var(--primary-foreground)',
    border: 'none',
    padding: 'var(--space-3) var(--space-6)',
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-semibold)',
    transition: 'transform var(--motion-normal) var(--easing-standard)'
  }}
  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
>
  Rozpocznij teraz
</Button>
```

#### Subtle Card Background
```tsx
<Card 
  style={{ 
    background: 'var(--gradient-subtle)',
    border: '1px solid var(--border)',
    padding: 'var(--space-6)'
  }}
>
  <CardContent>Zawartość z subtelnym gradientem</CardContent>
</Card>
```

---

## 6. 🔮 Backdrop Blur (Acrylic Effect)

### Tokeny:
```css
--backdrop-blur-sm: 8px
--backdrop-blur-md: 16px
--backdrop-blur-lg: 24px
--backdrop-tint:      oklch(1 0 0 / 0.7)     /* Light */
--backdrop-tint-dark: oklch(0.18 0 0 / 0.7)  /* Dark */
```

### Przykłady użycia:

#### Glassmorphic Navigation
```tsx
<nav 
  className="sticky top-0"
  style={{ 
    backdropFilter: `blur(var(--backdrop-blur-md))`,
    backgroundColor: 'var(--backdrop-tint)',
    borderBottom: '1px solid var(--border)',
    zIndex: 'var(--z-sticky)',
    padding: 'var(--space-4)'
  }}
>
  <div className="container">
    <Logo />
    <MenuItems />
  </div>
</nav>
```

#### Modal Overlay
```tsx
<DialogOverlay 
  style={{ 
    backdropFilter: `blur(var(--backdrop-blur-sm))`,
    backgroundColor: 'oklch(0 0 0 / 0.5)',
    zIndex: 'var(--z-overlay)'
  }}
/>

<DialogContent 
  style={{ 
    backdropFilter: `blur(var(--backdrop-blur-lg))`,
    backgroundColor: 'var(--backdrop-tint)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-4)',
    zIndex: 'var(--z-modal)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)'
  }}
>
  {/* Zawartość modala */}
</DialogContent>
```

#### Floating Card (macOS/iOS style)
```tsx
<Card 
  style={{ 
    backdropFilter: `blur(var(--backdrop-blur-md))`,
    backgroundColor: 'var(--backdrop-tint)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-2)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)'
  }}
>
  <CardTitle style={{ 
    fontSize: 'var(--text-xl)',
    fontWeight: 'var(--font-semibold)',
    marginBottom: 'var(--space-4)'
  }}>
    Glassmorphic Card
  </CardTitle>
  <CardContent>
    Efekt przezroczystości w stylu Fluent Design
  </CardContent>
</Card>
```

#### Popover z blur
```tsx
<PopoverContent 
  style={{ 
    backdropFilter: `blur(var(--backdrop-blur-md))`,
    backgroundColor: 'var(--backdrop-tint)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-4)',
    zIndex: 'var(--z-popover)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-4)'
  }}
>
  {/* Zawartość popover */}
</PopoverContent>
```

---

## 7. 🎯 Kompleksowe Przykłady

### Dashboard Card z wszystkimi tokenami

```tsx
<Card 
  style={{ 
    background: 'var(--gradient-subtle)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
    boxShadow: 'var(--shadow-2)',
    transition: `all var(--motion-normal) var(--easing-standard)`
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.boxShadow = 'var(--shadow-4)';
    e.currentTarget.style.transform = 'translateY(-2px)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.boxShadow = 'var(--shadow-2)';
    e.currentTarget.style.transform = 'translateY(0)';
  }}
>
  <CardHeader style={{ 
    borderBottom: '1px solid var(--border)',
    paddingBottom: 'var(--space-4)',
    marginBottom: 'var(--space-4)'
  }}>
    <CardTitle style={{ 
      fontSize: 'var(--text-2xl)',
      fontWeight: 'var(--font-semibold)',
      lineHeight: 'var(--leading-tight)',
      color: 'var(--card-foreground)'
    }}>
      Statystyki Tygodnia
    </CardTitle>
    <CardDescription style={{ 
      fontSize: 'var(--text-sm)',
      color: 'var(--muted-foreground)',
      marginTop: 'var(--space-2)'
    }}>
      Podsumowanie aktywności
    </CardDescription>
  </CardHeader>
  
  <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
    <div style={{ 
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      padding: 'var(--space-3)',
      backgroundColor: 'var(--success-light)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--success)'
    }}>
      <span style={{ 
        fontSize: 'var(--text-3xl)',
        fontWeight: 'var(--font-bold)',
        color: 'var(--success-dark)'
      }}>
        42
      </span>
      <div>
        <p style={{ 
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-medium)',
          color: 'var(--success-dark)'
        }}>
          Zaplanowane posiłki
        </p>
        <p style={{ 
          fontSize: 'var(--text-xs)',
          color: 'var(--success-dark)',
          opacity: 0.8
        }}>
          +12% vs poprzedni tydzień
        </p>
      </div>
    </div>
    
    <Button 
      style={{ 
        background: 'var(--gradient-brand)',
        color: 'var(--primary-foreground)',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-3) var(--space-4)',
        fontSize: 'var(--text-base)',
        fontWeight: 'var(--font-semibold)',
        height: 'var(--control-h-md)',
        transition: `all var(--motion-normal) var(--easing-standard)`,
        cursor: 'pointer'
      }}
    >
      Zobacz szczegóły
    </Button>
  </CardContent>
</Card>
```

### Modal z Acrylic Effect

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogOverlay 
    style={{ 
      backdropFilter: `blur(var(--backdrop-blur-sm))`,
      backgroundColor: 'oklch(0 0 0 / 0.4)',
      zIndex: 'var(--z-overlay)',
      animation: `fadeIn var(--motion-normal) var(--easing-decelerate)`
    }}
  />
  
  <DialogContent 
    style={{ 
      backdropFilter: `blur(var(--backdrop-blur-lg))`,
      backgroundColor: 'var(--backdrop-tint)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-4)',
      padding: 'var(--space-6)',
      zIndex: 'var(--z-modal)',
      maxWidth: '500px',
      animation: `slideUp var(--motion-normal) var(--easing-decelerate)`
    }}
  >
    <DialogTitle style={{ 
      fontSize: 'var(--text-2xl)',
      fontWeight: 'var(--font-semibold)',
      lineHeight: 'var(--leading-tight)',
      marginBottom: 'var(--space-2)'
    }}>
      Dodaj nowy przepis
    </DialogTitle>
    
    <DialogDescription style={{ 
      fontSize: 'var(--text-sm)',
      color: 'var(--muted-foreground)',
      lineHeight: 'var(--leading-normal)',
      marginBottom: 'var(--space-6)'
    }}>
      Wypełnij formularz, aby dodać przepis do swojej kolekcji
    </DialogDescription>
    
    <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <Input 
        placeholder="Nazwa przepisu"
        style={{ 
          height: 'var(--control-h-md)',
          fontSize: 'var(--text-base)',
          padding: '0 var(--space-3)'
        }}
      />
      
      <Textarea 
        placeholder="Opis przepisu"
        style={{ 
          fontSize: 'var(--text-base)',
          padding: 'var(--space-3)',
          minHeight: '120px'
        }}
      />
      
      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
        <Button 
          type="button"
          variant="outline"
          onClick={() => setIsOpen(false)}
          style={{ 
            height: 'var(--control-h-md)',
            padding: '0 var(--space-4)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-medium)'
          }}
        >
          Anuluj
        </Button>
        <Button 
          type="submit"
          style={{ 
            background: 'var(--gradient-brand)',
            color: 'var(--primary-foreground)',
            height: 'var(--control-h-md)',
            padding: '0 var(--space-4)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-semibold)'
          }}
        >
          Dodaj przepis
        </Button>
      </div>
    </form>
  </DialogContent>
</Dialog>
```

---

## 🎨 CSS Animations (do użycia z tokenami)

```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Użycie w komponencie */
.modal-enter {
  animation: slideUp var(--motion-normal) var(--easing-decelerate);
}

.modal-exit {
  animation: slideDown var(--motion-normal) var(--easing-accelerate);
}
```

---

## 📦 Tailwind Config Extension (opcjonalne)

Dodaj do `tailwind.config.js` dla łatwiejszego użycia:

```js
module.exports = {
  theme: {
    extend: {
      spacing: {
        '1': 'var(--space-1)',
        '2': 'var(--space-2)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '5': 'var(--space-5)',
        '6': 'var(--space-6)',
        '8': 'var(--space-8)',
        '10': 'var(--space-10)',
        '12': 'var(--space-12)',
        '16': 'var(--space-16)',
      },
      fontSize: {
        'xs': 'var(--text-xs)',
        'sm': 'var(--text-sm)',
        'base': 'var(--text-base)',
        'lg': 'var(--text-lg)',
        'xl': 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
        '4xl': 'var(--text-4xl)',
      },
      boxShadow: {
        'fluent-1': 'var(--shadow-1)',
        'fluent-2': 'var(--shadow-2)',
        'fluent-4': 'var(--shadow-4)',
      },
      backdropBlur: {
        'fluent-sm': 'var(--backdrop-blur-sm)',
        'fluent-md': 'var(--backdrop-blur-md)',
        'fluent-lg': 'var(--backdrop-blur-lg)',
      },
      zIndex: {
        'dropdown': 'var(--z-dropdown)',
        'sticky': 'var(--z-sticky)',
        'overlay': 'var(--z-overlay)',
        'modal': 'var(--z-modal)',
        'popover': 'var(--z-popover)',
        'toast': 'var(--z-toast)',
        'tooltip': 'var(--z-tooltip)',
      }
    }
  }
}
```

Wtedy możesz używać:

```tsx
<div className="p-4 text-xl shadow-fluent-2 backdrop-blur-fluent-md z-modal">
  Zawartość z Tailwind utilities
</div>
```

---

## ✅ Podsumowanie

Wszystkie nowe tokeny są teraz dostępne w `global.css` i gotowe do użycia. Korzystaj z nich aby:

- ✅ Utrzymać spójność spacingu w całej aplikacji
- ✅ Tworzyć czytelną hierarchię typografii
- ✅ Zarządzać z-index bez konfliktów
- ✅ Wykorzystać pełną paletę statusowych kolorów
- ✅ Dodawać nowoczesne gradienty
- ✅ Implementować efekty glassmorphic/acrylic

**Data**: 2025-11-09  
**Status**: ✅ Produkcyjne  
**Zgodność**: Fluent UI 2 + Best Practices

