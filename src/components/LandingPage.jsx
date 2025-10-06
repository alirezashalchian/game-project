import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Users,
  Gamepad2,
  Shield,
  Zap,
  MessageCircle,
  Mail,
  Github,
  Twitter,
} from "lucide-react";

export default function LandingPage({ onPlayNow }) {
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  const connectWallet = () => {
    // Placeholder for wallet connection logic
    setIsWalletConnected(!isWalletConnected);
  };

  const characters = [
    {
      name: "Knight",
      description: "Master of defense and honor",
      image: "/models/characters/knight.png",
      abilities: ["Shield Mastery", "Sword Combat", "Leadership"],
    },
    {
      name: "Mage",
      description: "Wielder of arcane powers",
      image: "/models/characters/mage.png",
      abilities: ["Elemental Magic", "Teleportation", "Enchantments"],
    },
    {
      name: "Barbarian",
      description: "Fierce warrior of the wilds",
      image: "/models/characters/barbarian.png",
      abilities: ["Berserker Rage", "Dual Wielding", "Intimidation"],
    },
    {
      name: "Rogue",
      description: "Master of stealth and precision",
      image: "/models/characters/rogue.png",
      abilities: ["Stealth", "Lock Picking", "Critical Strikes"],
    },
    {
      name: "Hooded Rogue",
      description: "Shadow assassin extraordinaire",
      image: "/models/characters/rogue_hooded.png",
      abilities: ["Shadow Step", "Poison Mastery", "Assassination"],
    },
  ];

  const features = [
    {
      icon: <Gamepad2 className="h-8 w-8" />,
      title: "3D Block Building",
      description:
        "Create epic structures in a fully immersive 3D environment with unlimited creativity.",
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Multiplayer Adventures",
      description:
        "Team up with friends or compete against players worldwide in real-time multiplayer.",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Blockchain Secured",
      description:
        "Your progress and achievements are secured on the blockchain with true ownership.",
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Fast Performance",
      description:
        "Optimized WebGL rendering ensures smooth gameplay across all modern browsers.",
    },
  ];

  const faqs = [
    {
      question: "How do I connect my wallet?",
      answer:
        "Click the 'Connect Wallet' button in the header and follow the prompts to connect your preferred crypto wallet.",
    },
    {
      question: "What browsers are supported?",
      answer:
        "Block Quest works on all modern browsers including Chrome, Firefox, Safari, and Edge with WebGL support.",
    },
    {
      question: "Is the game free to play?",
      answer:
        "Yes! Block Quest is free to play. Optional premium features and cosmetics are available for purchase.",
    },
    {
      question: "Can I play with friends?",
      answer:
        "Create or join multiplayer rooms to build and adventure together with up to 8 players.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg hero-gradient flex items-center justify-center">
              <Gamepad2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">Block Quest</span>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <a
              href="#characters"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Characters
            </a>
            <a
              href="#features"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Features
            </a>
            <a
              href="#faq"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              FAQ
            </a>
            <a
              href="#about"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              About
            </a>
          </nav>

          <Button
            onClick={connectWallet}
            className="hero-gradient text-white border-0"
          >
            <Wallet className="mr-2 h-4 w-4" />
            {isWalletConnected ? "Wallet Connected" : "Connect Wallet"}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge variant="secondary" className="w-fit">
                🎮 Now in Open Beta
              </Badge>

              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-balance">
                  Build Epic Worlds in{" "}
                  <span className="text-gradient">Block Quest</span>
                </h1>
                <p className="text-xl text-muted-foreground text-pretty max-w-lg">
                  The ultimate 3D block-building adventure where creativity
                  meets blockchain technology. Choose your character and start
                  building today.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="hero-gradient text-white border-0"
                  onClick={onPlayNow}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Play Now
                </Button>
                <Button size="lg" variant="outline">
                  Watch Trailer
                </Button>
              </div>

              <div className="flex items-center space-x-8 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span>10,000+ Active Players</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span>Cross-Platform</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative h-96 lg:h-[500px] rounded-2xl hero-gradient p-8 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>

                {/* Video placeholder with play button */}
                <div className="relative flex flex-col items-center justify-center text-white">
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 hover:bg-white/30 transition-colors cursor-pointer">
                    <Play className="h-8 w-8 ml-1" />
                  </div>
                  <p className="text-lg font-medium">Watch Game Trailer</p>
                  <p className="text-sm text-white/70">
                    See Block Quest in action
                  </p>
                </div>

                {/* Floating characters around the video placeholder */}
                <div className="absolute top-4 left-4">
                  <img
                    src="/models/characters/knight.png"
                    alt="Knight"
                    className="w-16 h-16 object-contain float-animation"
                    style={{ animationDelay: "0s" }}
                  />
                </div>
                <div className="absolute top-4 right-4">
                  <img
                    src="/models/characters/mage.png"
                    alt="Mage"
                    className="w-16 h-16 object-contain float-animation"
                    style={{ animationDelay: "0.5s" }}
                  />
                </div>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <img
                    src="/models/characters/barbarian.png"
                    alt="Barbarian"
                    className="w-16 h-16 object-contain float-animation"
                    style={{ animationDelay: "1s" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Character Showcase */}
      <section id="characters" className="py-20 bg-muted/30">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">
              Choose Your Champion
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              Each character brings unique abilities and playstyles to your
              Block Quest adventure.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {characters.map((character) => (
              <Card
                key={character.name}
                className="card-gradient border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 relative">
                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <img
                        src={character.image || "/placeholder.svg"}
                        alt={character.name}
                        className="w-20 h-20 object-contain"
                      />
                    </div>
                  </div>
                  <CardTitle className="text-lg">{character.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {character.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Abilities
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {character.abilities.map((ability) => (
                        <Badge
                          key={ability}
                          variant="secondary"
                          className="text-xs"
                        >
                          {ability}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">Game Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              Experience the next generation of block-building games with
              cutting-edge technology.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl hero-gradient flex items-center justify-center text-white">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground text-pretty">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-muted/30">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              Everything you need to know about Block Quest.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="card-gradient border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="py-16 border-t">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg hero-gradient flex items-center justify-center">
                  <Gamepad2 className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gradient">
                  Block Quest
                </span>
              </div>
              <p className="text-sm text-muted-foreground text-pretty">
                The ultimate 3D block-building adventure where creativity meets
                blockchain technology.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Game</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a
                  href="#"
                  className="block hover:text-primary transition-colors"
                >
                  Play Now
                </a>
                <a
                  href="#"
                  className="block hover:text-primary transition-colors"
                >
                  System Requirements
                </a>
                <a
                  href="#"
                  className="block hover:text-primary transition-colors"
                >
                  News & Updates
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Community</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a
                  href="#"
                  className="block hover:text-primary transition-colors"
                >
                  Discord
                </a>
                <a
                  href="#"
                  className="block hover:text-primary transition-colors"
                >
                  Reddit
                </a>
                <a
                  href="#"
                  className="block hover:text-primary transition-colors"
                >
                  Forums
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Contact</h4>
              <div className="space-y-2">
                <a
                  href="mailto:hello@blockquest.game"
                  className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  <span>hello@blockquest.game</span>
                </a>
                <div className="flex space-x-2">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Github className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Block Quest. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
