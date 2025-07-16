const Footer = () => {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-card border-t border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          © {currentYear} AI4KG. All rights reserved.
        </div>
        <div className="text-sm text-muted-foreground">
          Powered by Knowledge Graph Technology
        </div>
      </div>
    </footer>
  )
}

export default Footer
