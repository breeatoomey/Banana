![Getting Started](./docs/bananaLogo.png)

# Banana

### Our Story:

#### What if there was a programming language that mirrored the simplicity and versatility of a banana? This exact question is how the vision for "Banana" was born. Driven by a desire to make coding more accessible, efficient, and enjoyable, the Banana team has embarked on a journey to develop a novel (and slightly esoteric) language that truly peels away the complexities, making programming as delightful as peeling a ripe banana. The Banana coding language is a symbol of ingenuity and a testament to the extraordinary places inspiration can spring from in the world of technology.  This project aims to create an innovative language that provokes creativity, develops fundamental programming skills, and streamlines the coding experience for striving new developers.

To gain further insight into all that Banana has to offer, we encourage you to check our [Grammar](./src/banana.ohm) and [Introduction Slideshow Presentation](https://docs.google.com/presentation/d/1YpoADJYiS257-XRT7TDhop7ymTPCPcIxw2VfA3kvUsY/edit?usp=sharing).

### Features:

- Static Typing
- Object Oriented
- Modeling
- Intrinsic Methods
- Nesting
- Loops (For, While)
- Syntactic Distinctions Between Variable References
- Function Composition

### Types/Keywords:

|      JavaScript      |      Banana       |
| :------------------: | :---------------: |
| boolean (true/false) | Boo (ripe/rotten) |
|         void         |      Nothing      |
|        array         |       Bunch       |
|        class         |       model       |
|     constructor      |      config       |
|       function       |       pick        |
|        return        |       serve       |
|       else if        |       elif        |

### Intrinsic Methods:

|           JavaScript           |         Banana         |
| :----------------------------: | :--------------------: |
| string.split(separator, limit) | String.peel(separator) |
|         console.log()          |        plant()         |

### Special Operators:

|     JavaScript     |         Banana         |
| :----------------: | :--------------------: |
| cond ? exp1 : exp2 | cond? -> exp1 ->> exp2 |

### Examples:

#### Hello World

<table>
<tr>
<td> JavaScript </td> <td> Banana </td>
</tr>
<tr>
<td>

```javascript
console.log("Hello world!");
```

</td>
<td>
    
```
plant('hello world')
```

</td>
</tr>
</table>

#### Fibonacci

<table>
<tr>
<td> JavaScript </td> <td> Banana </td>
</tr>
<tr>
<td>

```javascript
function fibonacci(n) {
  if (n <= 1) {
    return n;
  } else {
    return fibonacci(n - 1) + fibonacci(n - 2);
  }
}
```

</td>
<td>
    
```
pick fibonacci(Int n) -> Int:
    if (n <= 1):
        serve n
    else:
        serve fibonacci(n-1) + fibonacci(n-2)
```

</td>
</tr>
</table>

#### Num Is Even

<table>
<tr>
<td> JavaScript </td> <td> Banana </td>
</tr>
<tr>
<td>

```javascript
function isEven(number) {
  if (number % 2 === 0) {
    return true;
  } else {
    return false;
  }
}
```

</td>
<td>
    
```
pick is_even(Int n) -> Boo:
    serve n % 2 == 0
```

</td>
</tr>
</table>

#### String to Array

<table>
<tr>
<td> JavaScript </td> <td> Banana </td>
</tr>
<tr>
<td>

```javascript
let sentence = "This is a sentence.";
let words = string.split(" ");

console.log(words); // output: ['This', 'is', 'a', 'sentence.']
```

</td>
<td>
    
```
let String sentence = 'This is a sentence.'
let Bunch words = sentence.peel(' ')

plant(words) // output: 0x00007F543210ABCD
plant(words!) // output: ['This', 'is', 'a', 'sentence.']

````

</td>
</tr>
</table>

#### Person Class
<table>
<tr>
<td> JavaScript </td> <td> Banana </td>
</tr>
<tr>
<td>

```javascript
class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  greet() {
    console.log(`Hello, my name is ${this.name}!`);
  }
}

const person1 = new Person("Alice", 30);
person1.greet(); // Output: Hello, my name is Alice!
````

</td>
<td>
    
```
model Person:
    config(String name, Int age):
        self.name = name 
        self.age = age

    pick greet() -> Nothing:
        plant('Hello, my name is \<self.name>!')

let Person person1 = Person('Alice', 30)
person1.greet() // Output: Hello, my name is Alice!

````

</td>
</table>

#### Positive or Negative with Ternary
<table>
<tr>
<td> JavaScript </td> <td> Banana </td>
</tr>
<tr>
<td>

```javascript
function checkSign(number) {
    var result = (number >= 0) ? "Positive" : "Negative";
    return result;
}
````

</td>
<td>
    
```
pick check-sign(Int num) -> String:
    let Boo result = (num > 0)? -> 'Positive' ->> 'Negative'
    serve result
```

</td>
</tr>
</table>

#### Elif Statement

<table>
<tr>
<td> JavaScript </td> <td> Banana </td>
</tr>
<tr>
<td>

```javascript
if (number > 0) {
  console.log("Number is positive");
} else if (number < 0) {
  console.log("Number is negative");
} else {
  console.log("Number is zero");
}
```

</td>
<td>
    
```
if num > 0:
    plant('Number is positive')
elif num < 0:
    plant('Number is negative')
else:
    plant('Number is zero')
```

</td>
</tr>
</table>

### Authors: Breea Toomey, Caroline Ellis, Denali Tonn, Dylan Krim, Maddie McDowell
