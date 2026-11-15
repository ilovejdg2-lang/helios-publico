/**
 * Softens crashes when extensions (or auto-translate) rewrite React-managed text
 * nodes. React still owns the fiber tree; this only avoids NotFoundError on
 * removeChild / insertBefore when the real DOM parent no longer matches.
 * @see https://github.com/facebook/react/issues/11538
 */
export function hardenDomAgainstExternalMutations() {
  if (typeof Node === 'undefined' || !Node.prototype) return

  const originalRemoveChild = Node.prototype.removeChild
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) {
      if (child.parentNode) return originalRemoveChild.call(child.parentNode, child) as T
      return child
    }
    return originalRemoveChild.call(this, child) as T
  }

  const originalInsertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function <T extends Node>(
    this: Node,
    newNode: T,
    referenceNode: Node | null,
  ): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return originalInsertBefore.call(this, newNode, null) as T
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T
  }
}
