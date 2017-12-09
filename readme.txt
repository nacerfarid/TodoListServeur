Bug Connus :

La premiere compilation de webpack genere une erreur de Metadata (lors de la compilation des module) > Probleme compatibilité module primeng 5 et angular 4
    Solution = changer un fichier .ts (ajouter un espace) et le sauvegarder, Webpack compilera sans soucis.

Des notifications viennent parfois apres, raison du bug inconnu, provient d'un module externe (bug module angular-toaster).
Des notifications ne s'effacent pas, il faut passer la souris dessus pour les effacer (bug module)

Lors de la suppression d'un item via hotkey, parfois la popup de confirmation ne s'affiche pas, parfois elle s'affiche avec un temps de retard, raison inconnu (bug module)
    Solution : echap, et refaire alt+d
    probleme non rencontrer lors d'un clic sur la croix pour delete un item : etrange car le chemin du code est le meme !

Lors de l'edition d'un item, il est obligatoire que le label ET le tag change pour que l'event (change) soit declanché par angular lorsque l'on appuie sur enter (vraiment pas propre, mais pas reussi a faire mieux)
L'item restera en edition tant que l'on change pas les 2 informations (vraiment pas pratique, due a un manque de connaissance des formulaires angular)