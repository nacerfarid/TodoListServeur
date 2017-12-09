Bug Connus :

La première compilation de webpack génère une erreur de Metadata (lors de la compilation des modules) > Problème de compatibilité entre le module PrimeNG 5 et Angular 4
    Solution = changer un fichier .ts (ajouter un espace) et le sauvegarder, Webpack compilera sans souci.

Des notifications viennent parfois après, raison du bug inconnu, provient d'un module externe (bug du module angular-toaster).
Des notifications ne s'effacent pas, il faut passer la souris dessus pour les effacer (bug module)

Lors de la suppression d'un item via hotkey, parfois la pop-up de confirmation ne s'affiche pas, parfois elle s'affiche avec un temps de retard, raison inconnu (bug module)
    Solution : echap, et refaire alt+d
    Problème non rencontré lors d'un clic sur la croix pour delete un item : étrange car le chemin du code est le même !

Lors de l'édition d'un item, il est obligatoire que le label ET le tag change pour que l'évent (change) soit déclenché par angular lorsque l'on appuie sur enter (vraiment pas propre, mais pas réussi à faire mieux)
L'item restera en édition tant que l'on ne change pas les 2 informations (vraiment pas pratique, due à un manque de connaissance des formulaires angular)
